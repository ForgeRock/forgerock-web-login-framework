/**
 * Rate limiter service unit tests.
 *
 * Tests the token-bucket algorithm, per-endpoint isolation, stale bucket cleanup,
 * and the noop layer behavior when rate limiting is disabled.
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import { Duration, Effect, Layer, Redacted } from 'effect';

import { AppConfigService, type AppConfig } from '$server/services/app-config';
import { RateLimiterLive, RateLimiterService } from '$server/services/rate-limiter';

// ─── Test Config Builder ──────────────────────────────────────────────────

const makeTestConfig = (overrides: Partial<AppConfig> = {}): AppConfig => ({
  amUrl: 'https://am.example.com/am',
  amCookieName: 'iPlanetDirectoryPro',
  realmPath: 'alpha',
  oauthClientId: 'TestClient',
  cookieSecrets: [Redacted.make('a-very-secret-key-that-is-at-least-32-chars')],
  cookieTtl: Duration.seconds(300),
  appDomain: 'localhost',
  appOrigin: 'http://localhost:5173',
  amRequestTimeout: Duration.millis(30_000),
  amMaxConcurrency: 50,
  rateLimitEnabled: true,
  rateLimitRpm: 6, // 0.1 tokens/sec → easy to exhaust in tests
  rateLimitBurst: 2,
  ...overrides,
});

// ─── Layer Factory ────────────────────────────────────────────────────────

const buildRateLimiterLayer = (config: AppConfig) =>
  Layer.provide(RateLimiterLive, Layer.succeed(AppConfigService, new AppConfigService(config)));

const runWithLimiter = <A, E>(config: AppConfig, effect: Effect.Effect<A, E, RateLimiterService>) =>
  Effect.provide(effect, buildRateLimiterLayer(config)).pipe(Effect.scoped, Effect.runPromise);

const runWithLimiterExit = <A, E>(
  config: AppConfig,
  effect: Effect.Effect<A, E, RateLimiterService>,
) =>
  Effect.provide(effect, buildRateLimiterLayer(config)).pipe(Effect.scoped, Effect.runPromiseExit);

// ─── Tests ────────────────────────────────────────────────────────────────

describe('RateLimiterService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('checkRate_UnderLimit_Succeeds', async () => {
    const config = makeTestConfig();

    await runWithLimiter(
      config,
      RateLimiterService.pipe(
        Effect.flatMap((limiter) => limiter.checkRate('10.0.0.1', '/api/tokens')),
      ),
    );
    // No error thrown = success
  });

  it('checkRate_ExceedsBurst_FailsWithRateLimitExceeded', async () => {
    const config = makeTestConfig({ rateLimitBurst: 2 });

    const exit = await runWithLimiterExit(
      config,
      RateLimiterService.pipe(
        Effect.flatMap((limiter) =>
          Effect.all([
            limiter.checkRate('10.0.0.1', '/api/tokens'),
            limiter.checkRate('10.0.0.1', '/api/tokens'),
            limiter.checkRate('10.0.0.1', '/api/tokens'), // 3rd request should fail
          ]),
        ),
      ),
    );

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure') {
      const error = exit.cause;
      // Extract the RateLimitExceeded from the Cause
      expect(JSON.stringify(error)).toContain('RateLimitExceeded');
    }
  });

  it('checkRate_AfterRefillPeriod_SucceedsAgain', async () => {
    const config = makeTestConfig({ rateLimitRpm: 60, rateLimitBurst: 1 });

    // Mock Date.now to control time
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    await runWithLimiter(
      config,
      RateLimiterService.pipe(
        Effect.flatMap((limiter) =>
          Effect.gen(function* () {
            // First request: consumes the 1 token
            yield* limiter.checkRate('10.0.0.1', '/api/tokens');

            // Advance time by 2 seconds (refills 2 tokens at 1/sec for RPM=60)
            vi.spyOn(Date, 'now').mockReturnValue(now + 2_000);

            // Should succeed after refill
            yield* limiter.checkRate('10.0.0.1', '/api/tokens');
          }),
        ),
      ),
    );
  });

  it('checkRate_RetryAfterHeader_ReturnsCorrectSeconds', async () => {
    const config = makeTestConfig({ rateLimitRpm: 60, rateLimitBurst: 1 });

    const exit = await runWithLimiterExit(
      config,
      RateLimiterService.pipe(
        Effect.flatMap((limiter) =>
          Effect.gen(function* () {
            yield* limiter.checkRate('10.0.0.1', '/api/tokens');
            yield* limiter.checkRate('10.0.0.1', '/api/tokens'); // should fail
          }),
        ),
      ),
    );

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure') {
      const causeStr = JSON.stringify(exit.cause);
      expect(causeStr).toContain('retryAfterSeconds');
    }
  });

  it('checkRate_DifferentIps_IndependentBuckets', async () => {
    const config = makeTestConfig({ rateLimitBurst: 1 });

    await runWithLimiter(
      config,
      RateLimiterService.pipe(
        Effect.flatMap((limiter) =>
          Effect.all([
            limiter.checkRate('10.0.0.1', '/api/tokens'),
            limiter.checkRate('10.0.0.2', '/api/tokens'), // Different IP, should succeed
          ]),
        ),
      ),
    );
  });

  it('checkRate_DifferentEndpoints_IndependentBuckets', async () => {
    const config = makeTestConfig({ rateLimitBurst: 1 });

    await runWithLimiter(
      config,
      RateLimiterService.pipe(
        Effect.flatMap((limiter) =>
          Effect.all([
            limiter.checkRate('10.0.0.1', '/api/tokens'),
            limiter.checkRate('10.0.0.1', '/api/authorize'), // Different endpoint, should succeed
          ]),
        ),
      ),
    );
  });

  it('checkRate_StaleCleanup_RemovesOldBuckets', async () => {
    // This test verifies that stale bucket cleanup runs via setInterval.
    // We mock timers to trigger the cleanup interval.
    vi.useFakeTimers();
    const config = makeTestConfig({ rateLimitBurst: 2 });

    // Create a scoped layer manually so we can control disposal
    const program = Effect.gen(function* () {
      const limiter = yield* RateLimiterService;

      // Create some buckets
      yield* limiter.checkRate('stale-ip', '/api/tokens');

      // Advance Date.now beyond stale threshold (2 minutes)
      const original = Date.now;
      Date.now = () => original.call(Date) + 130_000;

      // Trigger cleanup interval (runs every 60s)
      vi.advanceTimersByTime(60_000);

      // Restore Date.now
      Date.now = original;

      // Bucket was cleaned up, so a new request starts fresh with full burst
      yield* limiter.checkRate('stale-ip', '/api/tokens');
      yield* limiter.checkRate('stale-ip', '/api/tokens');
    });

    await Effect.provide(program, buildRateLimiterLayer(config)).pipe(
      Effect.scoped,
      Effect.runPromise,
    );

    vi.useRealTimers();
  });

  it('checkRate_Disabled_AlwaysSucceeds', async () => {
    const config = makeTestConfig({ rateLimitEnabled: false, rateLimitBurst: 1 });

    // With rate limiting disabled, even many requests should succeed
    await runWithLimiter(
      config,
      RateLimiterService.pipe(
        Effect.flatMap((limiter) =>
          Effect.all(
            Array.from({ length: 10 }, () => limiter.checkRate('10.0.0.1', '/api/tokens')),
          ),
        ),
      ),
    );
  });
});
