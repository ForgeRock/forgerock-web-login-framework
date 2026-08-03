/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it, vi } from 'vitest';
import {
  ZodArray,
  ZodBoolean,
  ZodCatch,
  ZodCustom,
  ZodDefault,
  ZodDiscriminatedUnion,
  ZodLiteral,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodRecord,
  ZodString,
  type ZodType,
  ZodUnion,
} from 'zod';

import { loggerConfigSchema, middlewareSchema, widgetConfigOptionsSchema } from './widget.config';

/**
 * Recursively extracts the shape of a Zod schema into a plain object tree.
 * The snapshot of this tree will fail if any field is added or removed at any depth.
 */
function describeSchema(schema: ZodType): unknown {
  // Unwrap wrapper types — ZodOptional/ZodDefault mark output as optional,
  // ZodCatch is a silent fallback wrapper and is transparent (does not add '?').
  if (schema instanceof ZodCatch) {
    return describeSchema(schema.unwrap() as ZodType);
  }
  if (schema instanceof ZodOptional || schema instanceof ZodDefault) {
    const inner = describeSchema(schema.unwrap() as ZodType);
    if (typeof inner === 'object' && inner !== null && !Array.isArray(inner)) {
      return { ...(inner as Record<string, unknown>), _optional: true };
    }
    return `${String(inner)}?`;
  }

  if (schema instanceof ZodObject) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema.shape as Record<string, ZodType>)) {
      result[key] = describeSchema(value);
    }
    return result;
  }

  if (schema instanceof ZodDiscriminatedUnion) {
    const key = schema._zod.def.discriminator as string;
    const values = (schema.options as ZodType[]).map((opt) => {
      const shape = (opt as ZodObject<Record<string, ZodType>>).shape;
      const disc = shape[key];
      return disc instanceof ZodLiteral ? String(disc.value) : '?';
    });
    return `discriminatedUnion(${key}: ${values.join(' | ')})`;
  }

  if (schema instanceof ZodUnion) {
    return `union(${(schema.options as ZodType[]).map(describeSchema).join(' | ')})`;
  }

  if (schema instanceof ZodArray) {
    return `array(${describeSchema(schema.element as ZodType)})`;
  }

  if (schema instanceof ZodRecord) {
    return 'record';
  }

  if (schema instanceof ZodCustom) {
    return 'custom';
  }
  if (schema instanceof ZodString) {
    return 'string';
  }
  if (schema instanceof ZodNumber) {
    return 'number';
  }
  if (schema instanceof ZodBoolean) {
    return 'boolean';
  }
  if (schema instanceof ZodLiteral) {
    return `'${String(schema.value)}'`;
  }

  return schema.constructor.name;
}

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

describe('widget.config — widgetConfigOptionsSchema', () => {
  it('full configure() surface — fails when any option is silently added, removed, or retyped', () => {
    expect(describeSchema(widgetConfigOptionsSchema)).toMatchSnapshot();
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
