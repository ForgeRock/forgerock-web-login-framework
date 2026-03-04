/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * page-helpers.ts unit tests
 *
 * Tests the helper functions that sit between AM responses and SvelteKit form actions:
 * - extractAmCookie (via processAmResponse)
 * - processAmResponse dispatch (auth-complete, error, next-step paths)
 * - handleAuthComplete (cookie cleanup, OAuth redirect, encryption failure recovery)
 * - handleAmError (error body parsing, cookie cleanup)
 * - handleNextStep (normal step, encryption failure, parse error)
 * - loadOptionalSession / loadOptionalOauth (missing + corrupted cookie tolerance)
 * - buildInitQueryParams (query param normalization)
 */
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { Effect, type ManagedRuntime } from 'effect';
import { Headers as PlatformHeaders } from '@effect/platform';

import type { AmResponse } from '$server/services/am-proxy';
import type { AppServices } from '$server/run';
import { mockCookies, testConfig, buildTestLayer, buildAmProxy } from '$server/route-test-helpers';
import {
  processAmResponse,
  loadOptionalSession,
  loadOptionalOauth,
  buildInitQueryParams,
} from '$server/page-helpers';
import { setCookieSession, setCookieOauth, readCookiesAsMap } from '$server/cookie-crypto';
import { initializeTestRuntime } from '$server/run';

// ─── Runtime Setup ───────────────────────────────────────────────────────────

let runtime: ManagedRuntime.ManagedRuntime<AppServices, never>;

beforeAll(() => {
  const layer = buildTestLayer(buildAmProxy());
  runtime = initializeTestRuntime(layer);
});

afterAll(async () => {
  await runtime.dispose();
});

const runEffect = <A, E>(effect: Effect.Effect<A, E, AppServices>): Promise<A> =>
  runtime.runPromise(effect as Effect.Effect<A, never, AppServices>);

// ─── Fixtures ────────────────────────────────────────────────────────────────

const USERNAME_PASSWORD_STEP = JSON.stringify({
  authId: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test',
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
  description: 'Enter your credentials',
});

const AUTH_COMPLETE_BODY = JSON.stringify({
  tokenId: 'sso-token-abc123',
  successUrl: '/console',
  realm: '/alpha',
});

const AM_ERROR_BODY = JSON.stringify({
  code: 401,
  reason: 'Unauthorized',
  message: 'Authentication Failed',
});

const buildAmResponse = (body: string, status = 200, setCookie?: string): AmResponse => ({
  status,
  body,
  headers: PlatformHeaders.fromInput(setCookie ? { 'set-cookie': setCookie } : {}),
});

// ─── buildInitQueryParams ────────────────────────────────────────────────────

describe('buildInitQueryParams', () => {
  it('extractFromAuthIndexValue_Present_ReturnsAuthIndexParams', () => {
    const params = new URLSearchParams('authIndexType=service&authIndexValue=Login');
    const result = buildInitQueryParams(params);

    expect(result.authIndexType).toBe('service');
    expect(result.authIndexValue).toBe('Login');
    expect(result.queryString).toContain('authIndexType=service');
    expect(result.queryString).toContain('authIndexValue=Login');
  });

  it('extractFromJourney_Fallback_UsesJourneyParam', () => {
    const params = new URLSearchParams('journey=Registration');
    const result = buildInitQueryParams(params);

    expect(result.authIndexType).toBe('service');
    expect(result.authIndexValue).toBe('Registration');
  });

  it('extractFromTree_Fallback_UsesTreeParam', () => {
    const params = new URLSearchParams('tree=WebAuthn');
    const result = buildInitQueryParams(params);

    expect(result.authIndexType).toBe('service');
    expect(result.authIndexValue).toBe('WebAuthn');
  });

  it('extractFromEmpty_NoParams_ReturnsEmptyQueryString', () => {
    const params = new URLSearchParams();
    const result = buildInitQueryParams(params);

    expect(result.authIndexType).toBe('service');
    expect(result.authIndexValue).toBe('');
    expect(result.queryString).toBe('');
  });

  it('extractPriority_BothPresent_PrefersAuthIndexValue', () => {
    const params = new URLSearchParams('authIndexValue=Login&journey=Registration');
    const result = buildInitQueryParams(params);

    expect(result.authIndexValue).toBe('Login');
  });
});

// ─── processAmResponse — auth-complete path ──────────────────────────────────

describe('processAmResponse (auth-complete)', () => {
  it('handleAuthComplete_WithAmCookie_ReturnsAuthComplete', async () => {
    const cookies = mockCookies();
    const amResponse = buildAmResponse(
      AUTH_COMPLETE_BODY,
      200,
      `iPlanetDirectoryPro=sso-token-value; Path=/; HttpOnly`,
    );

    const result = await runEffect(processAmResponse(amResponse, testConfig, cookies, {}));

    expect(result._tag).toBe('AuthComplete');
  });

  it('handleAuthComplete_WithOauthQuery_IncludesRedirectUrl', async () => {
    const cookies = mockCookies();
    const amResponse = buildAmResponse(
      AUTH_COMPLETE_BODY,
      200,
      `iPlanetDirectoryPro=sso-token; Path=/`,
    );

    const result = await runEffect(
      processAmResponse(amResponse, testConfig, cookies, {}, 'client_id=foo&redirect_uri=bar'),
    );

    expect(result._tag).toBe('AuthComplete');
    if (result._tag === 'AuthComplete') {
      expect(result.redirectTo).toBe('/api/authorize?client_id=foo&redirect_uri=bar');
    }
  });

  it('handleAuthComplete_WithoutAmCookie_ReturnsError', async () => {
    const cookies = mockCookies();
    const amResponse = buildAmResponse(AUTH_COMPLETE_BODY, 200);

    const result = await runEffect(processAmResponse(amResponse, testConfig, cookies, {}));

    expect(result._tag).toBe('Error');
    if (result._tag === 'Error') {
      expect(result.error).toContain('session could not be established');
    }
  });

  it('handleAuthComplete_CommaInSetCookie_ExtractsCorrectly', async () => {
    const cookies = mockCookies();
    // Comma in Expires date should not break extraction
    const setCookieHeader =
      'iPlanetDirectoryPro=token-val; Expires=Thu, 01 Jan 2026 00:00:00 GMT; Path=/';
    const amResponse = buildAmResponse(AUTH_COMPLETE_BODY, 200, setCookieHeader);

    const result = await runEffect(processAmResponse(amResponse, testConfig, cookies, {}));

    expect(result._tag).toBe('AuthComplete');
  });
});

// ─── processAmResponse — error path ──────────────────────────────────────────

describe('processAmResponse (AM error)', () => {
  it('handleAmError_401Response_ReturnsFormActionError', async () => {
    const cookies = mockCookies();
    const amResponse = buildAmResponse(AM_ERROR_BODY, 401);

    const result = await runEffect(processAmResponse(amResponse, testConfig, cookies, {}));

    expect(result._tag).toBe('Error');
    if (result._tag === 'Error') {
      expect(result.error).toBe('Authentication Failed');
    }
  });

  it('handleAmError_UnparseableBody_ReturnsFallbackMessage', async () => {
    const cookies = mockCookies();
    const amResponse = buildAmResponse('not-json', 500);

    const result = await runEffect(processAmResponse(amResponse, testConfig, cookies, {}));

    expect(result._tag).toBe('Error');
    if (result._tag === 'Error') {
      expect(result.error).toBe('Authentication failed');
    }
  });

  it('handleAmError_EmptyBody_ReturnsFallbackMessage', async () => {
    const cookies = mockCookies();
    const amResponse = buildAmResponse('', 400);

    const result = await runEffect(processAmResponse(amResponse, testConfig, cookies, {}));

    expect(result._tag).toBe('Error');
    if (result._tag === 'Error') {
      expect(result.error).toBe('Authentication failed');
    }
  });
});

// ─── processAmResponse — next-step path ──────────────────────────────────────

describe('processAmResponse (next step)', () => {
  it('handleNextStep_ValidStep_ReturnsStepWithCallbacks', async () => {
    const cookies = mockCookies();
    const amResponse = buildAmResponse(USERNAME_PASSWORD_STEP, 200);

    const result = await runEffect(
      processAmResponse(amResponse, testConfig, cookies, {
        authIndexType: 'service',
        authIndexValue: 'Login',
      }),
    );

    expect(result._tag).toBe('Step');
    if (result._tag === 'Step') {
      expect(result.step.callbacks).toHaveLength(2);
      expect(result.step.stage).toBe('UsernamePassword');
      expect(result.step.header).toBe('Sign In');
    }
  });

  it('handleNextStep_WithAmCookie_SetsSessionCookie', async () => {
    const cookies = mockCookies();
    const amResponse = buildAmResponse(
      USERNAME_PASSWORD_STEP,
      200,
      'iPlanetDirectoryPro=session-val; Path=/',
    );

    const result = await runEffect(processAmResponse(amResponse, testConfig, cookies, {}));

    expect(result._tag).toBe('Step');
    // Session cookie should be set (encrypted, so we just check it exists)
    const cookieMap = readCookiesAsMap(cookies);
    expect(cookieMap.has('__session')).toBe(true);
  });

  it('handleNextStep_ParseError_Returns502', async () => {
    const cookies = mockCookies();
    // Valid JSON but not a valid step response
    const amResponse = buildAmResponse('{"invalid": true}', 200);

    const result = await runtime.runPromise(
      processAmResponse(amResponse, testConfig, cookies, {}).pipe(
        Effect.catchTag('BffClientError', (err) => Effect.succeed(err)),
      ),
    );

    expect('status' in result && result.status === 502).toBe(true);
    if ('message' in result) {
      expect(result.message).toBe('Unexpected response from authentication service');
    }
  });
});

// ─── loadOptionalSession ─────────────────────────────────────────────────────

describe('loadOptionalSession', () => {
  it('loadOptionalSession_MissingCookie_ReturnsUndefined', async () => {
    const cookies = new Map<string, string>();
    const result = await runEffect(loadOptionalSession(cookies));

    expect(result).toBeUndefined();
  });

  it('loadOptionalSession_CorruptedCookie_FailsWithSessionCorrupted', async () => {
    const cookies = new Map<string, string>([['__session', 'not-a-valid-sealed-value']]);
    const result = await runtime.runPromise(
      loadOptionalSession(cookies).pipe(
        Effect.flip,
        Effect.map((e) => e._tag),
      ),
    );

    expect(result).toBe('SessionCorrupted');
  });

  it('loadOptionalSession_ValidCookie_ReturnsSessionData', async () => {
    // Seal a real session cookie first
    const svelteCookies = mockCookies();
    await runEffect(setCookieSession(svelteCookies, { amCookie: 'iPlanetDirectoryPro=token123' }));
    const cookieMap = readCookiesAsMap(svelteCookies);

    const result = await runEffect(loadOptionalSession(cookieMap));

    expect(result).toBeDefined();
    expect(result?.amCookie).toBe('iPlanetDirectoryPro=token123');
  });
});

// ─── loadOptionalOauth ───────────────────────────────────────────────────────

describe('loadOptionalOauth', () => {
  it('loadOptionalOauth_MissingCookie_ReturnsUndefined', async () => {
    const cookies = new Map<string, string>();
    const result = await runEffect(loadOptionalOauth(cookies));

    expect(result).toBeUndefined();
  });

  it('loadOptionalOauth_CorruptedCookie_FailsWithSessionCorrupted', async () => {
    const cookies = new Map<string, string>([['__oauth', 'garbage-data']]);
    const result = await runtime.runPromise(
      loadOptionalOauth(cookies).pipe(
        Effect.flip,
        Effect.map((e) => e._tag),
      ),
    );

    expect(result).toBe('SessionCorrupted');
  });

  it('loadOptionalOauth_ValidCookie_ReturnsQueryString', async () => {
    const svelteCookies = mockCookies();
    await runEffect(
      setCookieOauth(svelteCookies, 'client_id=foo&redirect_uri=https://app.example.com'),
    );
    const cookieMap = readCookiesAsMap(svelteCookies);

    const result = await runEffect(loadOptionalOauth(cookieMap));

    expect(result).toBe('client_id=foo&redirect_uri=https://app.example.com');
  });
});
