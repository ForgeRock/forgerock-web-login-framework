/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * GET /api/userinfo — route handler tests
 *
 * Verifies that the userinfo route requires an Authorization header,
 * proxies to AM's /userinfo endpoint, and passes through responses.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Effect } from 'effect';

import { AmUnreachable } from '$server/errors';
import {
  amSuccess,
  buildAmProxy,
  createApiEvent,
  setupRouteTestRuntime,
} from '$server/route-test-helpers';

describe('GET /api/userinfo', () => {
  const { runtime, setProxy } = setupRouteTestRuntime();
  let GET: typeof import('$routes/api/userinfo/+server').GET;

  beforeAll(async () => {
    const mod = await import('$routes/api/userinfo/+server');
    GET = mod.GET;
  });

  afterAll(async () => {
    await runtime.dispose();
  });

  it('GET_ValidAuth_ReturnsUserInfo', async () => {
    const userInfo = JSON.stringify({ sub: 'user123', name: 'John Smith' });
    setProxy(
      buildAmProxy({
        getUserInfo: ({ authorization }) => {
          expect(authorization).toBe('Bearer tok123');
          return Effect.succeed(amSuccess(userInfo));
        },
      }),
    );

    const event = createApiEvent({
      url: 'http://localhost:5173/api/userinfo',
      headers: { authorization: 'Bearer tok123' },
    });

    const response = await GET(event as never);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(userInfo);
  });

  it('GET_MissingAuth_Returns401', async () => {
    setProxy(buildAmProxy()); // getUserInfo should never be called

    const event = createApiEvent({
      url: 'http://localhost:5173/api/userinfo',
    });

    const response = await GET(event as never);
    expect(response.status).toBe(401);
    const body = JSON.parse(await response.text());
    expect(body.error).toBe('Authorization header required');
  });

  it('GET_AmReturns401_PassesThrough', async () => {
    setProxy(
      buildAmProxy({
        getUserInfo: () =>
          Effect.succeed(amSuccess(JSON.stringify({ error: 'invalid_token' }), 401)),
      }),
    );

    const event = createApiEvent({
      url: 'http://localhost:5173/api/userinfo',
      headers: { authorization: 'Bearer expired' },
    });

    const response = await GET(event as never);
    expect(response.status).toBe(401);
  });

  it('GET_AmUnreachable_Returns502', async () => {
    setProxy(
      buildAmProxy({
        getUserInfo: () =>
          Effect.fail(new AmUnreachable({ cause: new Error('ECONNREFUSED'), kind: 'connection' })),
      }),
    );

    const event = createApiEvent({
      url: 'http://localhost:5173/api/userinfo',
      headers: { authorization: 'Bearer tok123' },
    });

    const response = await GET(event as never);
    expect(response.status).toBe(502);
  });
});
