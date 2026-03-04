import type { HttpClient } from '@effect/platform';
import { Otlp } from '@effect/opentelemetry';
import { Config, Console, Effect, Layer, Logger, LogLevel, Option, pipe } from 'effect';

// ─── Config Descriptions ──────────────────────────────────────────────────────

const logFormat = Config.literal(
  'json',
  'pretty',
  'logfmt',
)('LOG_FORMAT').pipe(Config.withDefault('pretty' as const));

const logLevel = Config.literal(
  'Debug',
  'Info',
  'Warning',
  'Error',
  'Fatal',
)('LOG_LEVEL').pipe(Config.withDefault('Info' as const));

const otelEndpoint = Config.string('OTEL_EXPORTER_OTLP_ENDPOINT').pipe(Config.option);

const otelServiceName = Config.string('OTEL_SERVICE_NAME').pipe(Config.withDefault('login-bff'));

// ─── Logger Selection ─────────────────────────────────────────────────────────

/** Map format string to the corresponding Effect logger layer */
const formatToLayer = (format: 'json' | 'pretty' | 'logfmt'): Layer.Layer<never> => {
  switch (format) {
    case 'json':
      return Logger.json;
    case 'logfmt':
      return Logger.logFmt;
    case 'pretty':
      return Logger.pretty;
  }
};

/**
 * Console logger layer — always active.
 *
 * Reads `LOG_FORMAT` and `LOG_LEVEL` from env, selects the appropriate logger,
 * wraps it with span annotations (so traceId/spanId appear when OTel is active),
 * and sets the minimum log level.
 *
 * Uses `Layer.unwrapEffect` to read config at startup — same pattern as AppConfigService.
 * Dies on invalid config (startup defect, not recoverable).
 */
export const LoggerLive: Layer.Layer<never> = Layer.unwrapEffect(
  pipe(
    Effect.all({ format: logFormat, level: logLevel }),
    Effect.map(({ format, level }) =>
      Layer.mergeAll(formatToLayer(format), Logger.minimumLogLevel(LogLevel.fromLiteral(level))),
    ),
    Effect.tapError((err) => Console.error('Logger config failed:', String(err))),
    Effect.orDie,
  ),
);

// ─── OTel Export ──────────────────────────────────────────────────────────────

/**
 * OpenTelemetry export layer — active only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set.
 *
 * When the endpoint is configured, builds an `Otlp.layerJson` that exports traces,
 * logs, and metrics via OTLP/HTTP+JSON. When unset, produces `Layer.empty` — zero
 * overhead.
 *
 * Requires `HttpClient` from the app layer stack (provided via `Layer.provideMerge`
 * in `run.ts`).
 */
export const OtelLive: Layer.Layer<never, never, HttpClient.HttpClient> = Layer.unwrapEffect(
  pipe(
    Effect.all({ endpoint: otelEndpoint, serviceName: otelServiceName }),
    Effect.map(({ endpoint, serviceName }) =>
      Option.match(endpoint, {
        onNone: () => Layer.empty,
        onSome: (baseUrl) =>
          Otlp.layerJson({
            baseUrl,
            resource: { serviceName },
          }),
      }),
    ),
    Effect.orDie,
  ),
);
