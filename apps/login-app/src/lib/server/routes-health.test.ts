/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * GET /api/health — route handler tests
 *
 * Verifies the Kubernetes readiness probe returns correct status
 * based on OIDC discovery state. Unlike other routes, this one
 * bypasses handleRoute and talks directly to OidcDiscoveryService.
 *
 * Each test group needs its own runtime because the OidcDiscoveryService
 * mock behavior (isReady) varies per scenario.
 */
import { describe, expect, it } from 'vitest';
import { Effect, Layer } from 'effect';

import { AmProxyService } from '$server/services/am-proxy';
import { AppConfigService } from '$server/services/app-config';
import { OidcDiscoveryService } from '$server/services/oidc-discovery';
import { RateLimiterService } from '$server/services/rate-limiter';
import { initializeTestRuntime, type AppServices } from '$server/run';
import { buildAmProxy, testConfig, testOidcEndpoints } from '$server/route-test-helpers';

const buildHealthLayer = (isReady: Effect.Effect<boolean>): Layer.Layer<AppServices> =>
  Layer.mergeAll(
    Layer.succeed(AppConfigService, new AppConfigService(testConfig)),
    Layer.succeed(AmProxyService, buildAmProxy()),
    Layer.succeed(
      OidcDiscoveryService,
      new OidcDiscoveryService({
        endpoints: Effect.succeed(testOidcEndpoints),
        isReady,
      }),
    ),
    Layer.succeed(RateLimiterService, { checkRate: () => Effect.void }),
  );

describe('GET /api/health', () => {
  it('GET_DiscoveryComplete_Returns200', async () => {
    const runtime = initializeTestRuntime(buildHealthLayer(Effect.succeed(true)));
    try {
      const { GET } = await import('$routes/api/health/+server');
      const response = await GET({ url: new URL('http://localhost:5173/api/health') } as never);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.status).toBe('ready');
    } finally {
      await runtime.dispose();
    }
  });

  it('GET_DiscoveryIncomplete_Returns503', async () => {
    const runtime = initializeTestRuntime(buildHealthLayer(Effect.succeed(false)));
    try {
      const { GET } = await import('$routes/api/health/+server');
      const response = await GET({ url: new URL('http://localhost:5173/api/health') } as never);
      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.status).toBe('starting');
      expect(body.discovery).toBe(false);
    } finally {
      await runtime.dispose();
    }
  });

  it('GET_Defect_Returns503Error', async () => {
    const runtime = initializeTestRuntime(
      buildHealthLayer(Effect.die(new Error('Unexpected failure'))),
    );
    try {
      const { GET } = await import('$routes/api/health/+server');
      const response = await GET({ url: new URL('http://localhost:5173/api/health') } as never);
      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.status).toBe('error');
    } finally {
      await runtime.dispose();
    }
  });
});
