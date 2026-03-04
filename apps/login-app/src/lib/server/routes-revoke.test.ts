/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * POST /api/revoke — route handler tests
 *
 * Verifies that the revoke route reads the request body,
 * proxies to AM's /token/revoke endpoint, and passes through responses.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Effect } from 'effect';

import { AmUnreachable } from '$server/errors';
import {
  amSuccess,
  amErrorResponse,
  buildAmProxy,
  createApiEvent,
  setupRouteTestRuntime,
} from '$server/route-test-helpers';

describe('POST /api/revoke', () => {
  const { runtime, setProxy } = setupRouteTestRuntime();
  let POST: typeof import('$routes/api/revoke/+server').POST;

  beforeAll(async () => {
    const mod = await import('$routes/api/revoke/+server');
    POST = mod.POST;
  });

  afterAll(async () => {
    await runtime.dispose();
  });

  it('POST_ValidBody_ReturnsAmResponse', async () => {
    setProxy(
      buildAmProxy({
        revokeTokens: ({ body }) => {
          expect(body).toBe('token=xyz');
          return Effect.succeed(amSuccess(''));
        },
      }),
    );

    const event = createApiEvent({
      method: 'POST',
      url: 'http://localhost:5173/api/revoke',
      body: 'token=xyz',
    });

    const response = await POST(event as never);
    expect(response.status).toBe(200);
  });

  it('POST_AmError_PassesThrough', async () => {
    setProxy(
      buildAmProxy({
        revokeTokens: () => Effect.succeed(amErrorResponse(400, 'invalid_token')),
      }),
    );

    const event = createApiEvent({
      method: 'POST',
      url: 'http://localhost:5173/api/revoke',
      body: 'token=bad',
    });

    const response = await POST(event as never);
    expect(response.status).toBe(400);
  });

  it('POST_AmUnreachable_Returns502', async () => {
    setProxy(
      buildAmProxy({
        revokeTokens: () =>
          Effect.fail(new AmUnreachable({ cause: new Error('ECONNREFUSED'), kind: 'connection' })),
      }),
    );

    const event = createApiEvent({
      method: 'POST',
      url: 'http://localhost:5173/api/revoke',
      body: 'token=xyz',
    });

    const response = await POST(event as never);
    expect(response.status).toBe(502);
  });

  it('POST_OversizedBody_Returns400', async () => {
    setProxy(buildAmProxy());

    const event = createApiEvent({
      method: 'POST',
      url: 'http://localhost:5173/api/revoke',
      body: '',
      headers: { 'content-length': '2000000' },
    });

    const response = await POST(event as never);
    expect(response.status).toBe(400);
    const body = JSON.parse(await response.text());
    expect(body.error).toBe('Invalid request body');
  });
});
