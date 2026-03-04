/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * POST /api/tokens — route handler tests
 *
 * Verifies that the token exchange route correctly reads the request body,
 * proxies to AM's /access_token endpoint, and passes through responses.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Effect, Layer, type ManagedRuntime } from 'effect';

import { AmUnreachable } from '$server/errors';
import { AmProxyService } from '$server/services/am-proxy';
import { AppConfigService, type AppConfig } from '$server/services/app-config';
import { OidcDiscoveryService } from '$server/services/oidc-discovery';
import { RateLimiterLive } from '$server/services/rate-limiter';
import { initializeTestRuntime, type AppServices } from '$server/run';
import {
  amSuccess,
  amErrorResponse,
  buildAmProxy,
  createApiEvent,
  setupRouteTestRuntime,
  testConfig,
  testOidcEndpoints,
} from '$server/route-test-helpers';

describe('POST /api/tokens', () => {
  const { runtime, setProxy } = setupRouteTestRuntime();
  let POST: typeof import('$routes/api/tokens/+server').POST;

  // Import the route module after the runtime is initialized
  beforeAll(async () => {
    const mod = await import('$routes/api/tokens/+server');
    POST = mod.POST;
  });

  afterAll(async () => {
    await runtime.dispose();
  });

  it('POST_ValidBody_ReturnsAmResponse', async () => {
    const amBody = JSON.stringify({ access_token: 'tok123', token_type: 'Bearer' });
    setProxy(
      buildAmProxy({
        getTokens: ({ body }) => {
          expect(body).toBe('grant_type=authorization_code&code=abc');
          return Effect.succeed(amSuccess(amBody));
        },
      }),
    );

    const event = createApiEvent({
      method: 'POST',
      url: 'http://localhost:5173/api/tokens',
      body: 'grant_type=authorization_code&code=abc',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });

    const response = await POST(event as never);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(amBody);
  });

  it('POST_AmReturns401_PassesThroughStatus', async () => {
    setProxy(
      buildAmProxy({
        getTokens: () => Effect.succeed(amErrorResponse(401, 'invalid_grant')),
      }),
    );

    const event = createApiEvent({
      method: 'POST',
      url: 'http://localhost:5173/api/tokens',
      body: 'grant_type=authorization_code&code=bad',
    });

    const response = await POST(event as never);
    expect(response.status).toBe(401);
    const body = JSON.parse(await response.text());
    expect(body.error).toBe('invalid_grant');
  });

  it('POST_AmUnreachable_Returns502', async () => {
    setProxy(
      buildAmProxy({
        getTokens: () =>
          Effect.fail(new AmUnreachable({ cause: new Error('ECONNREFUSED'), kind: 'connection' })),
      }),
    );

    const event = createApiEvent({
      method: 'POST',
      url: 'http://localhost:5173/api/tokens',
      body: 'grant_type=authorization_code&code=abc',
    });

    const response = await POST(event as never);
    expect(response.status).toBe(502);
    const body = JSON.parse(await response.text());
    expect(body.error).toBe('AM service unavailable');
  });

  it('POST_EmptyBody_StillProxies', async () => {
    let receivedBody: string | undefined;
    setProxy(
      buildAmProxy({
        getTokens: ({ body }) => {
          receivedBody = body;
          return Effect.succeed(amSuccess('{}'));
        },
      }),
    );

    const event = createApiEvent({
      method: 'POST',
      url: 'http://localhost:5173/api/tokens',
      body: '',
    });

    await POST(event as never);
    expect(receivedBody).toBe('');
  });

  it('POST_OversizedBody_Returns400', async () => {
    setProxy(buildAmProxy()); // getTokens should never be called

    const event = createApiEvent({
      method: 'POST',
      url: 'http://localhost:5173/api/tokens',
      body: '',
      headers: { 'content-length': '2000000' },
    });

    const response = await POST(event as never);
    expect(response.status).toBe(400);
    const body = JSON.parse(await response.text());
    expect(body.error).toBe('Invalid request body');
  });

  describe('rate limiting', () => {
    let rlRuntime: ManagedRuntime.ManagedRuntime<AppServices, never>;

    beforeAll(async () => {
      // Dispose the noop runtime and create one with active rate limiting
      await runtime.dispose();

      const rateLimitConfig: AppConfig = {
        ...testConfig,
        rateLimitEnabled: true,
        rateLimitRpm: 6,
        rateLimitBurst: 1,
      };

      const baseLayer = Layer.mergeAll(
        Layer.succeed(AppConfigService, new AppConfigService(rateLimitConfig)),
        Layer.succeed(
          AmProxyService,
          buildAmProxy({
            getTokens: () => Effect.succeed(amSuccess('{}')),
          }),
        ),
        Layer.succeed(
          OidcDiscoveryService,
          new OidcDiscoveryService({
            endpoints: Effect.succeed(testOidcEndpoints),
            isReady: Effect.succeed(true),
          }),
        ),
      );
      rlRuntime = initializeTestRuntime(Layer.provideMerge(RateLimiterLive, baseLayer));
    });

    afterAll(async () => {
      await rlRuntime.dispose();
    });

    it('POST_RateLimitExceeded_Returns429WithRetryAfter', async () => {
      const event = createApiEvent({
        method: 'POST',
        url: 'http://localhost:5173/api/tokens',
        body: 'grant_type=authorization_code&code=abc',
      });

      // First request consumes the burst
      const first = await POST(event as never);
      expect(first.status).toBe(200);

      // Second request exceeds the limit
      const second = await POST(event as never);
      expect(second.status).toBe(429);
      expect(second.headers.get('retry-after')).toBeTruthy();
      const body = JSON.parse(await second.text());
      expect(body.error).toBe('Too many requests');
    });
  });
});
