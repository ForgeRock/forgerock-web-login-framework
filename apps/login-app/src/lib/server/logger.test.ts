import { describe, expect, it } from 'vitest';
import { ConfigProvider, Effect, Exit, Layer } from 'effect';

import { LoggerLive, OtelLive } from './logger';

/**
 * Build and evaluate a layer against a given env map.
 * Uses Effect.exit to capture both success and defects (from Effect.orDie).
 */
const resolveLayer = (layer: Layer.Layer<never, never, never>, env: Map<string, string>) =>
  Layer.build(layer).pipe(
    Effect.scoped,
    Effect.withConfigProvider(ConfigProvider.fromMap(env)),
    Effect.exit,
    Effect.runPromise,
  );

/**
 * OtelLive requires HttpClient — provide a minimal stub for config resolution tests.
 * The actual HTTP calls are never made because tests don't start an OTLP exporter.
 */
const resolveOtelLayer = (env: Map<string, string>) =>
  Layer.build(OtelLive).pipe(
    Effect.scoped,
    Effect.withConfigProvider(ConfigProvider.fromMap(env)),
    Effect.provide(stubHttpClientLayer),
    Effect.exit,
    Effect.runPromise,
  );

/**
 * Minimal HttpClient stub — OtelLive reads config and constructs the layer,
 * but does not make HTTP calls during construction.
 */
import { HttpClient } from '@effect/platform';

const stubHttpClient = HttpClient.make(() => {
  throw new Error('HttpClient stub — should not be called during layer construction');
});

const stubHttpClientLayer = Layer.succeed(HttpClient.HttpClient, stubHttpClient);

describe('LoggerLive', () => {
  it('LoggerLive_DefaultConfig_Succeeds', async () => {
    const exit = await resolveLayer(LoggerLive, new Map());
    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('LoggerLive_JsonFormat_Succeeds', async () => {
    const exit = await resolveLayer(LoggerLive, new Map([['LOG_FORMAT', 'json']]));
    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('LoggerLive_LogfmtFormat_Succeeds', async () => {
    const exit = await resolveLayer(LoggerLive, new Map([['LOG_FORMAT', 'logfmt']]));
    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('LoggerLive_InvalidFormat_Dies', async () => {
    const exit = await resolveLayer(LoggerLive, new Map([['LOG_FORMAT', 'xml']]));
    expect(Exit.isFailure(exit)).toBe(true);
  });

  it('LoggerLive_DebugLevel_Succeeds', async () => {
    const exit = await resolveLayer(LoggerLive, new Map([['LOG_LEVEL', 'Debug']]));
    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('LoggerLive_InvalidLevel_Dies', async () => {
    const exit = await resolveLayer(LoggerLive, new Map([['LOG_LEVEL', 'TRACE']]));
    expect(Exit.isFailure(exit)).toBe(true);
  });
});

describe('OtelLive', () => {
  it('OtelLive_NoEndpoint_ProducesEmptyLayer', async () => {
    const exit = await resolveOtelLayer(new Map());
    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('OtelLive_WithEndpoint_Succeeds', async () => {
    const exit = await resolveOtelLayer(
      new Map([['OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318']]),
    );
    expect(Exit.isSuccess(exit)).toBe(true);
  });
});
