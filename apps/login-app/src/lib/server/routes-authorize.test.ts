/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * Authorize route (/api/authorize) unit tests.
 *
 * Tests the GET handler directly by calling the exported function with
 * mock SvelteKit events. SvelteKit's redirect() throws, so success paths
 * are verified by catching the thrown redirect object.
 */
import { beforeAll, describe, expect, it, afterAll } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { Effect } from 'effect';
import { Headers as PlatformHeaders } from '@effect/platform';

import {
  setupRouteTestRuntime,
  buildAmProxy,
  createApiEvent,
  mockCookies,
  testConfig,
} from '$server/route-test-helpers';
import { setCookieOauth, setCookieSession } from '$server/cookie-crypto';
import { AmUnreachable } from '$server/errors';
import type { AppServices } from '$server/run';

// ─── Setup ──────────────────────────────────────────────────────────────────

const { runtime, setProxy } = setupRouteTestRuntime();
let authorizeRoute: typeof import('$routes/api/authorize/+server');

afterAll(async () => {
  await runtime.dispose();
});

// Helper to run effects with the test runtime
const runEffect = <A, E>(effect: Effect.Effect<A, E, AppServices>): Promise<A> =>
  runtime.runPromise(effect as Effect.Effect<A, never, AppServices>);

/**
 * Set up a valid session cookie (AM cookie + PKCE code_verifier) for tests
 * that need an authenticated session.
 */
const seedSessionCookie = async (cookies: ReturnType<typeof mockCookies>) => {
  await runEffect(
    setCookieSession(cookies, {
      amCookie: 'iPlanetDirectoryPro=sso-token-123',
      codeVerifier: 'test-code-verifier-abc123-padded-to-forty-three',
    }),
  );
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/authorize', () => {
  // Import dynamically so the module picks up the test runtime
  beforeAll(async () => {
    authorizeRoute = await import('$routes/api/authorize/+server');
  });

  it('GET_NoSessionCookie_RedirectsToLogin', async () => {
    setProxy(buildAmProxy());
    const event = createApiEvent({
      url: 'http://localhost:5173/api/authorize?scope=openid&redirect_uri=http://localhost:5173/callback',
    });

    try {
      await authorizeRoute.GET(event as never);
      expect.fail('Expected redirect');
    } catch (err) {
      expect(isRedirect(err)).toBe(true);
      const redir = err as { status: number; location: string };
      expect(redir.status).toBe(302);
      expect(redir.location).toBe('/');
    }

    // Should have set the __oauth cookie for later use
    expect(event.cookies.get('__oauth')).toBeDefined();
  });

  it('GET_CorruptedSessionCookie_RedirectsToLogin', async () => {
    setProxy(buildAmProxy());
    const cookies = mockCookies();
    // Write garbage into the session cookie to simulate corruption
    cookies.set('__session', 'corrupted-not-valid-base64url-encrypted-data', {
      path: '/',
    } as never);

    const event = createApiEvent({
      url: 'http://localhost:5173/api/authorize?scope=openid&redirect_uri=http://localhost:5173/callback',
      cookies,
    });

    try {
      await authorizeRoute.GET(event as never);
      expect.fail('Expected redirect');
    } catch (err) {
      expect(isRedirect(err)).toBe(true);
      const redir = err as { status: number; location: string };
      expect(redir.status).toBe(302);
      expect(redir.location).toBe('/');
    }

    // Should have set the __oauth cookie despite corrupted session
    expect(cookies.get('__oauth')).toBeDefined();
  });

  it('GET_ValidSession_RedirectsWithAuthCode', async () => {
    const redirectUrl = `${testConfig.appOrigin}/callback?code=auth-code-xyz`;
    setProxy(
      buildAmProxy({
        authorize: () =>
          Effect.succeed({
            redirectUrl,
            status: 302,
            headers: PlatformHeaders.fromInput({}),
          }),
      }),
    );

    const cookies = mockCookies();
    await seedSessionCookie(cookies);

    const event = createApiEvent({
      url: 'http://localhost:5173/api/authorize?scope=openid&redirect_uri=http://localhost:5173/callback',
      cookies,
    });

    try {
      await authorizeRoute.GET(event as never);
      expect.fail('Expected redirect');
    } catch (err) {
      expect(isRedirect(err)).toBe(true);
      const redir = err as { status: number; location: string };
      expect(redir.status).toBe(302);
      expect(redir.location).toBe(redirectUrl);
    }
  });

  it('GET_MissingCodeVerifier_Returns400', async () => {
    setProxy(buildAmProxy());
    const cookies = mockCookies();
    // Session without codeVerifier
    await runEffect(setCookieSession(cookies, { amCookie: 'iPlanetDirectoryPro=sso-token-123' }));

    const event = createApiEvent({
      url: 'http://localhost:5173/api/authorize?scope=openid',
      cookies,
    });

    const result = await authorizeRoute.GET(event as never);
    expect(result.status).toBe(400);
  });

  it('GET_AmUnreachable_Returns502', async () => {
    setProxy(
      buildAmProxy({
        authorize: () =>
          Effect.fail(new AmUnreachable({ cause: new Error('ECONNREFUSED'), kind: 'connection' })),
      }),
    );

    const cookies = mockCookies();
    await seedSessionCookie(cookies);

    const event = createApiEvent({
      url: 'http://localhost:5173/api/authorize?scope=openid',
      cookies,
    });

    const result = await authorizeRoute.GET(event as never);
    expect(result.status).toBe(502);
  });

  it('GET_ValidSessionWithOauthCookie_UsesUrlQueryForRedirect', async () => {
    const redirectUrl = `${testConfig.appOrigin}/callback?code=auth-code-xyz`;
    setProxy(
      buildAmProxy({
        authorize: () =>
          Effect.succeed({
            redirectUrl,
            status: 302,
            headers: PlatformHeaders.fromInput({}),
          }),
      }),
    );

    const cookies = mockCookies();
    await seedSessionCookie(cookies);
    // Seed an __oauth cookie — authorize route should ignore it and use URL search params
    await runEffect(
      setCookieOauth(cookies, 'scope=openid&redirect_uri=http://localhost:5173/callback'),
    );

    const event = createApiEvent({
      url: 'http://localhost:5173/api/authorize?scope=openid&redirect_uri=http://localhost:5173/callback',
      cookies,
    });

    try {
      await authorizeRoute.GET(event as never);
      expect.fail('Expected redirect');
    } catch (err) {
      expect(isRedirect(err)).toBe(true);
      const redir = err as { status: number; location: string };
      expect(redir.status).toBe(302);
      expect(redir.location).toBe(redirectUrl);
    }

    // After successful authorize, all cookies should be cleared
    expect(cookies.get('__session')).toBeUndefined();
    expect(cookies.get('__oauth')).toBeUndefined();
  });

  it('GET_RedirectOriginMismatch_Returns400', async () => {
    setProxy(
      buildAmProxy({
        authorize: () =>
          Effect.succeed({
            redirectUrl: 'https://evil.example.com/steal?code=abc',
            status: 302,
            headers: PlatformHeaders.fromInput({}),
          }),
      }),
    );

    const cookies = mockCookies();
    await seedSessionCookie(cookies);

    const event = createApiEvent({
      url: 'http://localhost:5173/api/authorize?scope=openid',
      cookies,
    });

    const result = await authorizeRoute.GET(event as never);
    expect(result.status).toBe(400);
  });
});
