/**
 * In-memory token bucket rate limiter per IP address.
 *
 * Each IP gets a bucket with `burst` tokens, refilled at `rpm / 60` tokens per second.
 * When the bucket is empty, requests are rejected with `RateLimitExceeded`.
 *
 * This is a simple in-memory implementation suitable for single-instance deployments.
 * For horizontally-scaled deployments, replace with a Redis-backed implementation
 * via the same service interface.
 */
import { Context, Effect, Layer } from 'effect';

import { RateLimitExceeded } from '$server/errors';
import { AppConfigService } from '$server/services/app-config';

// ─── Service Interface ───────────────────────────────────────────────────────

export class RateLimiterService extends Context.Tag('RateLimiterService')<
  RateLimiterService,
  {
    readonly checkRate: (ip: string, endpoint: string) => Effect.Effect<void, RateLimitExceeded>;
  }
>() {}

// ─── Token Bucket Implementation ─────────────────────────────────────────────

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

/** Create a token-bucket rate limiter with a managed cleanup interval. */
const createInMemoryRateLimiter = (rpm: number, burst: number) => {
  const buckets = new Map<string, TokenBucket>();
  const refillRate = rpm / 60; // tokens per second

  return Effect.acquireRelease(
    Effect.sync(() => {
      const cleanupInterval = setInterval(() => {
        const now = Date.now();
        const staleThreshold = 120_000; // 2 minutes
        for (const [key, bucket] of buckets) {
          if (now - bucket.lastRefill > staleThreshold) {
            buckets.delete(key);
          }
        }
      }, 60_000);
      cleanupInterval.unref();
      return cleanupInterval;
    }),
    (interval) => Effect.sync(() => clearInterval(interval)),
  ).pipe(
    Effect.map((): RateLimiterService['Type'] => ({
      checkRate: (ip, endpoint) =>
        Effect.sync(() => {
          const now = Date.now();
          const bucketKey = `${ip}:${endpoint}`;
          let bucket = buckets.get(bucketKey);

          if (!bucket) {
            bucket = { tokens: burst, lastRefill: now };
            buckets.set(bucketKey, bucket);
          }

          // Refill tokens based on elapsed time
          const elapsed = (now - bucket.lastRefill) / 1000;
          bucket.tokens = Math.min(burst, bucket.tokens + elapsed * refillRate);
          bucket.lastRefill = now;

          if (bucket.tokens < 1) {
            const retryAfterSeconds = Math.ceil((1 - bucket.tokens) / refillRate);
            return { allowed: false as const, retryAfterSeconds, ip };
          }

          bucket.tokens -= 1;
          return { allowed: true as const };
        }).pipe(
          Effect.flatMap((result) =>
            result.allowed
              ? Effect.void
              : Effect.fail(
                  new RateLimitExceeded({
                    ip: result.ip,
                    retryAfterSeconds: result.retryAfterSeconds,
                  }),
                ),
          ),
        ),
    })),
  );
};

// ─── No-op Implementation ────────────────────────────────────────────────────

/** Pass-through limiter used when `RATE_LIMIT_ENABLED=false` (default) */
const noopRateLimiter: RateLimiterService['Type'] = {
  checkRate: () => Effect.void,
};

// ─── Layer ────────────────────────────────────────────────────────────────────

/**
 * Produces an active token-bucket limiter when `RATE_LIMIT_ENABLED=true`,
 * otherwise a no-op pass-through. This allows deployments behind an
 * infrastructure-level rate limiter (WAF, load balancer) to skip the
 * in-app limiter without code changes.
 */
export const RateLimiterLive: Layer.Layer<RateLimiterService, never, AppConfigService> =
  Layer.scoped(
    RateLimiterService,
    Effect.flatMap(AppConfigService, (config) =>
      config.rateLimitEnabled
        ? createInMemoryRateLimiter(config.rateLimitRpm, config.rateLimitBurst)
        : Effect.succeed(noopRateLimiter),
    ),
  );
