/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Data, Effect } from 'effect';

export * from './api.schemas';

/** Failure returned when a fields projection contains an empty path segment. */
export class InvalidFieldsError extends Data.TaggedError('InvalidFieldsError')<{
  readonly message: string;
}> {}

/**
 * Parses a fields projection into property paths.
 *
 * @param input - A comma-separated projection, or null when no projection was supplied.
 * @returns An Effect yielding immutable dot-notation property paths; an empty result represents the full record.
 */
export const parseFields = (
  input: string | null,
): Effect.Effect<ReadonlyArray<ReadonlyArray<string>>, InvalidFieldsError> => {
  if (input === null || input.trim() === '') return Effect.succeed([]);

  const fields = input.split(',').map((path) => path.split('.').map((segment) => segment.trim()));
  return fields.some((segments) => segments.some((segment) => segment.length === 0))
    ? Effect.fail(new InvalidFieldsError({ message: 'Invalid fields projection' }))
    : Effect.succeed(fields);
};

/**
 * Returns a record containing only requested top-level or nested property paths.
 * Built on a null-prototype object with own-property checks so that paths like
 * `__proto__.toString.x` cannot pollute `Object.prototype`.
 *
 * @param record - The source component record.
 * @param fields - Parsed projection paths; no paths retains the full record.
 * @returns A new, projected record.
 */
export const projectRecord = (
  record: Record<string, unknown>,
  fields: ReadonlyArray<ReadonlyArray<string>>,
): Record<string, unknown> => {
  if (fields.length === 0) return { ...record };

  const projected: Record<string, unknown> = Object.create(null);
  for (const path of fields) {
    let source: unknown = record;
    let destination: Record<string, unknown> = projected;

    for (let index = 0; index < path.length; index += 1) {
      const segment = path[index];
      if (segment === '__proto__' || segment === 'constructor' || segment === 'prototype') break;
      if (typeof source !== 'object' || source === null || !Object.hasOwn(source, segment)) break;
      const value = (source as Record<string, unknown>)[segment];
      if (index === path.length - 1) {
        destination[segment] = value;
      } else {
        const next = destination[segment];
        if (typeof next !== 'object' || next === null || Array.isArray(next)) {
          destination[segment] = {};
        }
        destination = destination[segment] as Record<string, unknown>;
        source = value;
      }
    }
  }
  return projected;
};
