/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * POST /api/sessions — route handler tests
 *
 * Verifies that the session logout route unseals the __session cookie,
 * passes the AM cookie to AM's /sessions?_action=logout endpoint,
 * clears all cookies, and passes through responses.
 *
 * This is the most complex route — it requires real cookie encryption
 * for test setup (valid __session cookies).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Effect } from 'effect';

import { AmUnreachable } from '$server/errors';
import { setCookieSession } from '$server/cookie-crypto';
import { AppConfigService } from '$server/services/app-config';
import {
  amSuccess,
  buildAmProxy,
  mockCookies,
  createApiEvent,
  setupRouteTestRuntime,
  testConfig,
} from '$server/route-test-helpers';

describe('POST /api/sessions', () => {
  const { runtime, setProxy } = setupRouteTestRuntime();
  let POST: typeof import('$routes/api/sessions/+server').POST;

  beforeAll(async () => {
    const mod = await import('$routes/api/sessions/+server');
    POST = mod.POST;
  });

  afterAll(async () => {
    await runtime.dispose();
  });

  /** Create cookies with a valid encrypted __session containing the given AM cookie */
  const withSession = async (
    cookies: ReturnType<typeof mockCookies>,
    amCookie: string,
  ): Promise<void> => {
    const configLayer = Effect.provideService(
      setCookieSession(cookies, { amCookie }),
      AppConfigService,
      new AppConfigService(testConfig),
    );
    await Effect.runPromise(configLayer);
  };

  it('POST_ValidSession_LogsOutAndClearsCookies', async () => {
    const cookies = mockCookies();
    await withSession(cookies, 'iPlanetDirectoryPro=sso-token-abc123');

    setProxy(
      buildAmProxy({
        logout: () =>
          Effect.succeed(amSuccess(JSON.stringify({ result: 'Successfully logged out' }))),
      }),
    );

    const event = createApiEvent({
      method: 'POST',
      url: 'http://localhost:5173/api/sessions',
      cookies,
    });

    const response = await POST(event as never);
    expect(response.status).toBe(200);

    // All cookies should be deleted after logout
    expect(cookies.get('__session')).toBeUndefined();
    expect(cookies.get('__aid')).toBeUndefined();
    expect(cookies.get('__step')).toBeUndefined();
  });

  it('POST_MissingSessionCookie_Returns401', async () => {
    setProxy(buildAmProxy());
    const cookies = mockCookies(); // empty — no __session

    const event = createApiEvent({
      method: 'POST',
      url: 'http://localhost:5173/api/sessions',
      cookies,
    });

    const response = await POST(event as never);
    expect(response.status).toBe(401);
    const body = JSON.parse(await response.text());
    expect(body.error).toBe('Session expired');
  });

  it('POST_CorruptedSessionCookie_Returns401', async () => {
    setProxy(buildAmProxy());
    const cookies = mockCookies();
    cookies.set('__session', 'corrupted-garbage-data', { path: '/' });

    const event = createApiEvent({
      method: 'POST',
      url: 'http://localhost:5173/api/sessions',
      cookies,
    });

    const response = await POST(event as never);
    expect(response.status).toBe(401);
    const body = JSON.parse(await response.text());
    expect(body.error).toBe('Session expired');
  });

  it('POST_AmUnreachable_Returns502', async () => {
    const cookies = mockCookies();
    await withSession(cookies, 'iPlanetDirectoryPro=sso-token-abc123');

    setProxy(
      buildAmProxy({
        logout: () =>
          Effect.fail(new AmUnreachable({ cause: new Error('ECONNREFUSED'), kind: 'connection' })),
      }),
    );

    const event = createApiEvent({
      method: 'POST',
      url: 'http://localhost:5173/api/sessions',
      cookies,
    });

    const response = await POST(event as never);
    expect(response.status).toBe(502);
  });

  it('POST_PassesAmCookie_ToLogout', async () => {
    const cookies = mockCookies();
    const amCookieValue = 'iPlanetDirectoryPro=my-specific-sso-token';
    await withSession(cookies, amCookieValue);

    let receivedCookie = '';
    setProxy(
      buildAmProxy({
        logout: ({ cookie }) => {
          receivedCookie = cookie;
          return Effect.succeed(amSuccess('{}'));
        },
      }),
    );

    const event = createApiEvent({
      method: 'POST',
      url: 'http://localhost:5173/api/sessions',
      cookies,
    });

    await POST(event as never);
    expect(receivedCookie).toBe(amCookieValue);
  });
});
