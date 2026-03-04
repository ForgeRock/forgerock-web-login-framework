/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * +page.server.ts orchestration tests
 *
 * These verify that the SvelteKit form actions correctly wire together
 * the cookie, step-mapper, and AM proxy layers. The core question:
 *
 *   "When a user submits a form, does the BFF read the step from cookies,
 *    merge the form values, and send the right thing to AM?"
 *
 * The pipeline tests (page-actions.test.ts) prove the data transformation
 * is correct. These tests prove the actions call that pipeline correctly
 * and manage cookie lifecycle across multiple steps.
 */
import { describe, expect, it, afterAll } from 'vitest';
import { Effect, Layer, type ManagedRuntime } from 'effect';
import { Headers as PlatformHeaders } from '@effect/platform';
import type { Cookies } from '@sveltejs/kit';
import { AmProxyService, type AmProxy, type AmResponse } from '$server/services/am-proxy';
import { AppConfigService } from '$server/services/app-config';
import { OidcDiscoveryService } from '$server/services/oidc-discovery';
import { RateLimiterService } from '$server/services/rate-limiter';
import { initializeTestRuntime, type AppServices, type FormActionResult } from '$server/run';
import { mockCookies, testConfig, testOidcEndpoints } from '$server/route-test-helpers';

// ─── Infrastructure (read once, skip when reading tests) ────────────────────

// ─── Mock SvelteKit RequestEvent ────────────────────────────────────────────

/**
 * The properties +page.server.ts actually reads from the event.
 * SvelteKit's full RequestEvent includes route-specific generics, OTel Span
 * objects, and other properties we don't need. Rather than stubbing all of them,
 * we type what we use and cast once here.
 */
interface TestEvent {
  readonly cookies: Cookies;
  readonly url: URL;
  readonly request: Request;
  readonly getClientAddress: () => string;
}

const createEvent = (opts: { cookies: Cookies; url?: string; formData?: FormData }): TestEvent => {
  const url = opts.url ?? 'http://localhost:5173/';
  return {
    cookies: opts.cookies,
    url: new URL(url),
    request: opts.formData
      ? new Request(url, { method: 'POST', body: opts.formData })
      : new Request(url),
    getClientAddress: () => '127.0.0.1',
  };
};

/** What AM sends as the Set-Cookie header when auth completes */
const AM_SESSION_COOKIE = 'iPlanetDirectoryPro=sso-token-abc123; Path=/; HttpOnly';

// ─── AM Response Builders ───────────────────────────────────────────────────

/** AM says: "here's the next step, render these callbacks" */
const amReturnsStep = (body: string): AmResponse => ({
  status: 200,
  body,
  headers: PlatformHeaders.fromInput({}),
});

/** AM says: "authentication complete, here's your session" */
const amReturnsAuthComplete = (): AmResponse => ({
  status: 200,
  body: JSON.stringify({ tokenId: 'sso-token-abc123', successUrl: '/console', realm: '/alpha' }),
  headers: PlatformHeaders.fromInput({ 'set-cookie': AM_SESSION_COOKIE }),
});

/** AM says: "wrong credentials" */
const amReturnsError = (message: string): AmResponse => ({
  status: 401,
  body: JSON.stringify({ code: 401, reason: 'Unauthorized', message }),
  headers: PlatformHeaders.fromInput({}),
});

// ─── Realistic AM Step Payloads ─────────────────────────────────────────────

/** What AM returns for a Username/Password tree */
const USERNAME_PASSWORD_STEP = JSON.stringify({
  authId: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.step-1-auth-id',
  callbacks: [
    {
      type: 'NameCallback',
      output: [{ name: 'prompt', value: 'User Name' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
    {
      type: 'PasswordCallback',
      output: [{ name: 'prompt', value: 'Password' }],
      input: [{ name: 'IDToken2', value: '' }],
      _id: 1,
    },
  ],
  stage: 'UsernamePassword',
  header: 'Sign In',
});

/** What AM returns for an MFA choice step */
const MFA_CHOICE_STEP = JSON.stringify({
  authId: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.step-2-auth-id',
  callbacks: [
    {
      type: 'ChoiceCallback',
      output: [
        { name: 'prompt', value: 'How do you want to verify?' },
        { name: 'choices', value: ['Email', 'SMS'] },
        { name: 'defaultChoice', value: 0 },
      ],
      input: [{ name: 'IDToken1', value: 0 }],
      _id: 0,
    },
  ],
  stage: 'MfaChoice',
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('+page.server.ts orchestration', () => {
  let runtime: ManagedRuntime.ManagedRuntime<AppServices, never>;
  let pageServer: typeof import('$routes/(app)/+page.server');

  /** Record of every call the BFF made to AM's /authenticate endpoint */
  let amCalls: Array<{ body: string; cookie: string; queryString: string }>;

  /**
   * Wire up a mock AM that returns `responses` in order.
   * Must be called before each test (or group) that needs different AM behavior.
   */
  const givenAmWillReturn = async (...responses: AmResponse[]) => {
    const queue = [...responses];
    amCalls = [];

    const proxy: AmProxy = {
      authenticate: (params) => {
        amCalls.push(params);
        const next = queue.shift();
        if (!next) return Effect.die(new Error('Test bug: AM received more calls than expected'));
        return Effect.succeed(next);
      },
      authorize: () => Effect.die(new Error('not under test')),
      getTokens: () => Effect.die(new Error('not under test')),
      getUserInfo: () => Effect.die(new Error('not under test')),
      revokeTokens: () => Effect.die(new Error('not under test')),
      endSession: () => Effect.die(new Error('not under test')),
      logout: () => Effect.die(new Error('not under test')),
    };

    const layer = Layer.mergeAll(
      Layer.succeed(AppConfigService, new AppConfigService(testConfig)),
      Layer.succeed(AmProxyService, proxy),
      Layer.succeed(
        OidcDiscoveryService,
        new OidcDiscoveryService({
          endpoints: Effect.succeed(testOidcEndpoints),
          isReady: Effect.succeed(true),
        }),
      ),
      Layer.succeed(RateLimiterService, { checkRate: () => Effect.void }),
    );

    if (runtime) await runtime.dispose();
    runtime = initializeTestRuntime(layer);
    pageServer = await import('$routes/(app)/+page.server');
  };

  afterAll(async () => {
    if (runtime) await runtime.dispose();
  });

  /**
   * Typed wrappers for page actions. The cast to `never` is isolated here
   * so test bodies stay clean. SvelteKit's generated route types require
   * route-specific generics and OTel Span objects that don't exist in tests.
   */
  const callInit = (event: TestEvent): Promise<FormActionResult> =>
    pageServer.actions.init(event as never) as Promise<FormActionResult>;

  const callStep = (event: TestEvent): Promise<FormActionResult> =>
    pageServer.actions.step(event as never) as Promise<FormActionResult>;

  const callLoad = (event: TestEvent): Promise<FormActionResult> =>
    pageServer.load(event as never) as Promise<FormActionResult>;

  /** Simulate: user clicks "Start" or page auto-submits the init form */
  const userStartsJourney = (cookies: Cookies, journey?: string) =>
    createEvent({
      cookies,
      url: `http://localhost:5173/${journey ? `?journey=${journey}` : ''}`,
    });

  /** Simulate: user fills in form fields and clicks Submit */
  const userSubmitsForm = (cookies: Cookies, values: Record<string, string>) => {
    const fd = new FormData();
    for (const [name, value] of Object.entries(values)) {
      fd.set(name, value);
    }
    return createEvent({ cookies, formData: fd });
  };

  /** Simulate: user visits the page (browser navigates to /) */
  const userVisitsPage = (cookies: Cookies) => createEvent({ cookies });

  // ─────────────────────────────────────────────────────────────────────────

  it('two-step login: init → submit credentials → auth complete', async () => {
    await givenAmWillReturn(amReturnsStep(USERNAME_PASSWORD_STEP), amReturnsAuthComplete());
    const cookies = mockCookies();

    // User visits the page and starts the Login journey
    const step1 = await callInit(userStartsJourney(cookies, 'Login'));

    // BFF returns the step so the page can render the form
    expect(step1._tag).toBe('Step');
    if (step1._tag === 'Step') {
      expect(step1.step.stage).toBe('UsernamePassword');
      expect(step1.step.callbacks).toHaveLength(2);
    }

    // At this point, cookies contain the encrypted step data.
    // The page renders <input name="IDToken1"> and <input name="IDToken2">.
    // The user fills them in and clicks Submit.
    const step2 = await callStep(
      userSubmitsForm(cookies, { IDToken1: 'jsmith', IDToken2: 'P@ssw0rd' }),
    );

    // BFF says auth is complete
    expect(step2._tag).toBe('AuthComplete');

    // Verify what the BFF sent to AM on the second call
    const amRequest = JSON.parse(amCalls[1].body);
    expect(amRequest.callbacks[0].input[0]).toEqual({ name: 'IDToken1', value: 'jsmith' });
    expect(amRequest.callbacks[1].input[0]).toEqual({ name: 'IDToken2', value: 'P@ssw0rd' });

    // Session cookie exists (for subsequent OAuth flow), auth cookies cleared
    expect(cookies.get('__session')).toBeDefined();
    expect(cookies.get('__aid')).toBeUndefined();
    expect(cookies.get('__step')).toBeUndefined();
  });

  it('three-step login: credentials → MFA choice → auth complete', async () => {
    await givenAmWillReturn(
      amReturnsStep(USERNAME_PASSWORD_STEP),
      amReturnsStep(MFA_CHOICE_STEP),
      amReturnsAuthComplete(),
    );
    const cookies = mockCookies();

    // Step 1: start journey
    await callInit(userStartsJourney(cookies, 'Login'));

    // Step 2: submit credentials → AM returns MFA choice
    const mfaStep = await callStep(
      userSubmitsForm(cookies, { IDToken1: 'jsmith', IDToken2: 'P@ssw0rd' }),
    );
    expect(mfaStep._tag).toBe('Step');
    if (mfaStep._tag === 'Step') {
      expect(mfaStep.step.stage).toBe('MfaChoice');
      expect(mfaStep.step.callbacks[0].type).toBe('ChoiceCallback');
    }

    // Step 3: user selects "SMS" (index 1) from the <select>
    const result = await callStep(userSubmitsForm(cookies, { IDToken1: '1' }));
    expect(result._tag).toBe('AuthComplete');

    // Verify the choice was coerced to a number for AM
    const mfaRequest = JSON.parse(amCalls[2].body);
    expect(mfaRequest.callbacks[0].input[0].value).toBe(1);
  });

  it('wrong password: AM returns error, cookies are cleared', async () => {
    await givenAmWillReturn(amReturnsStep(USERNAME_PASSWORD_STEP), amReturnsError('Login failure'));
    const cookies = mockCookies();

    // Start journey
    await callInit(userStartsJourney(cookies, 'Login'));
    // Cookies should exist after init
    expect(cookies.get('__aid')).toBeDefined();
    expect(cookies.get('__step')).toBeDefined();

    // Submit wrong password
    const result = await callStep(
      userSubmitsForm(cookies, { IDToken1: 'jsmith', IDToken2: 'wrong' }),
    );

    // BFF surfaces the error message from AM
    expect(result._tag).toBe('Error');
    if (result._tag === 'Error') {
      expect(result.error).toBe('Login failure');
    }

    // All cookies cleared — user must start over
    expect(cookies.get('__aid')).toBeUndefined();
    expect(cookies.get('__step')).toBeUndefined();
    expect(cookies.get('__session')).toBeUndefined();
  });

  it('expired session: submitting without cookies returns session expired', async () => {
    await givenAmWillReturn(); // AM won't be called
    const cookies = mockCookies(); // empty — no prior init

    const result = await callStep(userSubmitsForm(cookies, { IDToken1: 'jsmith' }));

    expect(result._tag).toBe('Error');
    if (result._tag === 'Error') {
      expect(result.error).toBe('Session expired, please try again');
    }
    expect(amCalls).toHaveLength(0); // BFF never called AM
  });

  it('page load with existing step cookies returns the step', async () => {
    await givenAmWillReturn(amReturnsStep(USERNAME_PASSWORD_STEP));
    const cookies = mockCookies();

    // Init sets the cookies
    await callInit(userStartsJourney(cookies));

    // Simulate: user refreshes the page (GET, not POST)
    const loadResult = await callLoad(userVisitsPage(cookies));

    // The load function reads cookies and returns the step
    expect(loadResult._tag).toBe('Step');
    if (loadResult._tag === 'Step') {
      expect(loadResult.step.stage).toBe('UsernamePassword');
      expect(loadResult.step.callbacks).toHaveLength(2);
    }
  });

  it('page load without cookies returns empty state', async () => {
    await givenAmWillReturn();
    const cookies = mockCookies();

    const loadResult = await callLoad(userVisitsPage(cookies));

    // Empty step (no callbacks) — page will show init form
    expect(loadResult._tag).toBe('Step');
    if (loadResult._tag === 'Step') {
      expect(loadResult.step.callbacks).toHaveLength(0);
    }
  });

  it('auth complete with missing AM cookie returns error, not redirect', async () => {
    // AM says "auth complete" but sends no Set-Cookie header (no session cookie)
    const amReturnsAuthCompleteWithoutCookie = (): AmResponse => ({
      status: 200,
      body: JSON.stringify({
        tokenId: 'sso-token-abc123',
        successUrl: '/console',
        realm: '/alpha',
      }),
      headers: PlatformHeaders.fromInput({}), // No set-cookie header
    });

    await givenAmWillReturn(
      amReturnsStep(USERNAME_PASSWORD_STEP),
      amReturnsAuthCompleteWithoutCookie(),
    );
    const cookies = mockCookies();

    // Start journey
    await callInit(userStartsJourney(cookies, 'Login'));

    // Submit credentials — AM says auth complete but no cookie
    const result = await callStep(
      userSubmitsForm(cookies, { IDToken1: 'jsmith', IDToken2: 'P@ssw0rd' }),
    );

    // Should return an error, NOT redirect to /api/authorize
    expect(result._tag).toBe('Error');
    if (result._tag === 'Error') {
      expect(result.error).toContain('session could not be established');
    }
  });

  it('init forwards journey name to AM as authIndexValue', async () => {
    await givenAmWillReturn(amReturnsStep(USERNAME_PASSWORD_STEP));
    const cookies = mockCookies();

    await callInit(userStartsJourney(cookies, 'Registration'));

    expect(amCalls[0].queryString).toContain('authIndexType=service');
    expect(amCalls[0].queryString).toContain('authIndexValue=Registration');
    expect(amCalls[0].body).toBe('{}'); // init always sends empty body
  });
});
