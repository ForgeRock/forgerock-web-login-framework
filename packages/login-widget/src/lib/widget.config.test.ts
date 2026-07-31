/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it, vi } from 'vitest';

import { loggerConfigSchema, middlewareSchema } from './widget.config';

describe('widget.config — loggerConfigSchema', () => {
  it('parses each valid log level', () => {
    for (const level of ['none', 'error', 'warn', 'info', 'debug'] as const) {
      expect(loggerConfigSchema.parse({ level }).level).toBe(level);
    }
  });

  it('parses a custom sink alongside the level', () => {
    const custom = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() };
    expect(loggerConfigSchema.parse({ level: 'debug', custom })).toMatchObject({
      level: 'debug',
      custom,
    });
  });

  it('requires level when logger is set — an empty object is rejected', () => {
    expect(() => loggerConfigSchema.parse({})).toThrow();
  });

  it('requires level even when only a custom sink is given', () => {
    const custom = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() };
    expect(() => loggerConfigSchema.parse({ custom })).toThrow();
  });

  it('rejects an unknown log level', () => {
    expect(() => loggerConfigSchema.parse({ level: 'verbose' })).toThrow();
  });

  it('rejects a non-object custom sink', () => {
    expect(() => loggerConfigSchema.parse({ level: 'error', custom: 'nope' })).toThrow();
  });

  // Guards against silent drift — a mistyped or stale key is a hard error.
  it('rejects an unknown key (strict)', () => {
    expect(() => loggerConfigSchema.parse({ level: 'error', logLevel: 'error' })).toThrow();
  });
});

describe('widget.config — middlewareSchema', () => {
  it('parses an array of functions', () => {
    const middleware = [vi.fn(), vi.fn()];
    expect(middlewareSchema.parse(middleware)).toStrictEqual(middleware);
  });

  it('parses an empty array', () => {
    expect(() => middlewareSchema.parse([])).not.toThrow();
  });

  it('rejects a non-array', () => {
    expect(() => middlewareSchema.parse(vi.fn())).toThrow();
  });

  it('rejects an array containing a non-function', () => {
    expect(() => middlewareSchema.parse([vi.fn(), 'not-a-fn'])).toThrow();
  });
});
