import { Deferred, Effect } from 'effect';

/** Service interface — allows route handlers to check if shutdown is in progress */
interface ShutdownSignalShape {
  /** Resolves with the signal name when SIGTERM/SIGINT is received */
  readonly await: Effect.Effect<NodeJS.Signals>;
  /** True once a shutdown signal has been received */
  readonly isShuttingDown: Effect.Effect<boolean>;
}

/**
 * Shutdown signal service — manages process signal lifecycle via acquireRelease.
 *
 * Acquire: registers SIGTERM/SIGINT handlers that resolve a Deferred.
 * Release: removes the signal handlers (runs when ManagedRuntime disposes).
 */
export class ShutdownSignal extends Effect.Service<ShutdownSignal>()('ShutdownSignal', {
  scoped: Effect.gen(function* () {
    const deferred = yield* Deferred.make<NodeJS.Signals>();

    const onSignal = (signal: NodeJS.Signals) => {
      Deferred.unsafeDone(deferred, Effect.succeed(signal));
    };

    yield* Effect.acquireRelease(
      Effect.sync(() => {
        process.on('SIGTERM', onSignal);
        process.on('SIGINT', onSignal);
      }),
      () =>
        Effect.sync(() => {
          process.removeListener('SIGTERM', onSignal);
          process.removeListener('SIGINT', onSignal);
        }),
    );

    return {
      await: Deferred.await(deferred),
      isShuttingDown: Deferred.isDone(deferred),
    } satisfies ShutdownSignalShape;
  }),
}) {}
