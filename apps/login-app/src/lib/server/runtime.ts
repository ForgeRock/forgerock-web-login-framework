import type { HttpClient } from '@effect/platform';
import { Duration, Effect, Layer, ManagedRuntime } from 'effect';

import { LoggerLive, OtelLive } from '$server/logger';
import type { AmProxyService } from '$server/services/am-proxy';
import type { AppConfigService } from '$server/services/app-config';
import type { OidcDiscoveryService } from '$server/services/oidc-discovery';
import type { RateLimiterService } from '$server/services/rate-limiter';
import { ShutdownSignal } from '$server/services/shutdown-signal';

// ─── Types ───────────────────────────────────────────────────────────────────

/** All services available to route handlers (no session store — stateless cookie architecture) */
export type AppServices =
  | AppConfigService
  | AmProxyService
  | OidcDiscoveryService
  | RateLimiterService;

/**
 * Full layer requirements — AppServices plus HttpClient.
 *
 * HttpClient is included so it can be shared with OtelLive (which needs an HTTP
 * client for OTLP export). This prevents creating a second FetchHttpClient.layer
 * that would conflict with the app's redirect: 'manual' configuration via
 * Effect's layer memoization.
 */
type AppLayer = AppServices | HttpClient.HttpClient;

// ─── Runtime Singleton ───────────────────────────────────────────────────────

const SHUTDOWN_TIMEOUT = Duration.seconds(5);

/**
 * Module-level singleton runtime, initialized once from hooks.server.ts.
 * Typed as AppServices — the common requirement for all route handlers.
 * Production adds ShutdownSignal on top, but that's consumed only by startShutdownWatcher
 * (which holds its own reference to the full runtime).
 */
let runtime: ManagedRuntime.ManagedRuntime<AppServices, never> | undefined;

/**
 * Initialize the app runtime with the composed Layer.
 * Merges in ShutdownSignal for process signal lifecycle management,
 * then forks a background fiber that waits for SIGTERM/SIGINT and triggers disposal.
 *
 * The layer must provide HttpClient.HttpClient so OtelLive can reuse the same
 * HTTP client (with redirect: 'manual') instead of creating its own.
 */
export const initializeAppRuntime = (layer: Layer.Layer<AppLayer>): void => {
  if (runtime) {
    throw new Error('App runtime already initialized — possible duplicate hooks.server.ts load');
  }
  // OtelLive requires HttpClient which is part of AppLayer. Layer.provideMerge
  // should eliminate the requirement, but TypeScript's Exclude on complex Effect
  // service types doesn't resolve cleanly. Providing OtelLive with the app layer
  // explicitly satisfies the HttpClient requirement before merging.
  const otelProvided = OtelLive.pipe(Layer.provide(layer));
  const fullLayer = layer.pipe(
    Layer.merge(ShutdownSignal.Default),
    Layer.merge(LoggerLive),
    Layer.merge(otelProvided),
  );
  const fullRuntime = ManagedRuntime.make(fullLayer);
  runtime = fullRuntime;
  startShutdownWatcher(fullRuntime);
};

/**
 * Initialize the app runtime for tests — no signal handling, no shutdown watcher.
 * Tests manage their own lifecycle via the returned runtime.
 */
export const initializeTestRuntime = (
  layer: Layer.Layer<AppServices>,
): ManagedRuntime.ManagedRuntime<AppServices, never> => {
  const testRuntime = ManagedRuntime.make(layer);
  runtime = testRuntime;
  return testRuntime;
};

/**
 * Fork a background fiber that waits for a shutdown signal, then disposes the runtime.
 *
 * The signal-waiting runs inside Effect (benefiting from the ShutdownSignal service).
 * Disposal and process.kill run in Promise-land — outside the fiber system —
 * because the fiber gets interrupted when the runtime disposes.
 */
const startShutdownWatcher = (
  rt: ManagedRuntime.ManagedRuntime<AppServices | ShutdownSignal, never>,
): void => {
  const waitForSignal = ShutdownSignal.pipe(
    Effect.flatMap((s) => s.await),
    Effect.tap((signal) =>
      Effect.logInfo('Shutdown signal received, disposing runtime').pipe(
        Effect.annotateLogs({ signal }),
      ),
    ),
  );

  /** Structured JSON log to stderr — Effect runtime is disposing, so Effect.log is unavailable. */
  const logToStderr = (level: string, message: string, fields?: Record<string, unknown>): void => {
    process.stderr.write(
      JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...fields }) + '\n',
    );
  };

  rt.runPromise(waitForSignal).then(
    (signal) => {
      const timeout = setTimeout(() => {
        logToStderr('warn', 'Runtime disposal timed out, forcing exit', {
          timeoutMs: Duration.toMillis(SHUTDOWN_TIMEOUT),
        });
        process.kill(process.pid, signal);
      }, Duration.toMillis(SHUTDOWN_TIMEOUT));

      rt.dispose()
        .catch((err) =>
          logToStderr('warn', 'Error during runtime disposal', {
            error: err instanceof Error ? err.message : String(err),
          }),
        )
        .finally(() => {
          clearTimeout(timeout);
          runtime = undefined;
          process.kill(process.pid, signal);
        });
    },
    (err) => {
      logToStderr('error', 'Shutdown watcher failed — exiting to avoid unhandled signal state', {
        error: err instanceof Error ? err.message : String(err),
      });
      process.exit(1);
    },
  );
};

export const getRuntime = (): ManagedRuntime.ManagedRuntime<AppServices, never> => {
  if (!runtime) {
    throw new Error('App runtime not initialized. Ensure hooks.server.ts has loaded.');
  }
  return runtime;
};

// ─── Runtime Boundary ────────────────────────────────────────────────────────

/** Execute an infallible Effect on the app runtime, crossing into Promise-land. */
export const run = <A>(effect: Effect.Effect<A, never, AppServices>): Promise<A> =>
  getRuntime().runPromise(effect);
