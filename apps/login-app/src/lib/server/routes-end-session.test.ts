/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * GET /api/end-session — route handler tests
 *
 * Verifies that the end-session route requires an Authorization header,
 * passes query string to AM's /connect/endSession, and passes through responses.
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

describe('GET /api/end-session', () => {
  const { runtime, setProxy } = setupRouteTestRuntime();
  let GET: typeof import('$routes/api/end-session/+server').GET;

  beforeAll(async () => {
    const mod = await import('$routes/api/end-session/+server');
    GET = mod.GET;
  });

  afterAll(async () => {
    await runtime.dispose();
  });

  it('GET_ValidRequest_ReturnsAmResponse', async () => {
    setProxy(
      buildAmProxy({
        endSession: ({ authorization, queryString }) => {
          expect(authorization).toBe('Bearer id_token_123');
          expect(queryString).toContain('post_logout_redirect_uri');
          return Effect.succeed(amSuccess(''));
        },
      }),
    );

    const event = createApiEvent({
      url: 'http://localhost:5173/api/end-session?post_logout_redirect_uri=http%3A%2F%2Flocalhost',
      headers: { authorization: 'Bearer id_token_123' },
    });

    const response = await GET(event as never);
    expect(response.status).toBe(200);
  });

  it('GET_MissingAuth_Returns401', async () => {
    setProxy(buildAmProxy());

    const event = createApiEvent({
      url: 'http://localhost:5173/api/end-session',
    });

    const response = await GET(event as never);
    expect(response.status).toBe(401);
    const body = JSON.parse(await response.text());
    expect(body.error).toBe('Authorization header required');
  });

  it('GET_PassesQueryString_ToAmProxy', async () => {
    let receivedQueryString = '';
    setProxy(
      buildAmProxy({
        endSession: ({ queryString }) => {
          receivedQueryString = queryString;
          return Effect.succeed(amSuccess(''));
        },
      }),
    );

    const event = createApiEvent({
      url: 'http://localhost:5173/api/end-session?post_logout_redirect_uri=https%3A%2F%2Fexample.com&id_token_hint=tok',
      headers: { authorization: 'Bearer tok' },
    });

    await GET(event as never);
    // Route strips the leading '?' via .slice(1)
    expect(receivedQueryString).toBe(
      'post_logout_redirect_uri=https%3A%2F%2Fexample.com&id_token_hint=tok',
    );
  });

  it('GET_AmUnreachable_Returns502', async () => {
    setProxy(
      buildAmProxy({
        endSession: () =>
          Effect.fail(new AmUnreachable({ cause: new Error('ECONNREFUSED'), kind: 'connection' })),
      }),
    );

    const event = createApiEvent({
      url: 'http://localhost:5173/api/end-session',
      headers: { authorization: 'Bearer tok' },
    });

    const response = await GET(event as never);
    expect(response.status).toBe(502);
  });
});
