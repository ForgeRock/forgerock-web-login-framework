/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Data, Effect, Schema } from 'effect';

import { type ComponentResponse, ComponentResponseSchema } from './component-api.schemas';

export * from './component-api.schemas';

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

  const projected: Record<string, unknown> = {};
  for (const path of fields) {
    let source: unknown = record;
    let destination: Record<string, unknown> = projected;

    for (let index = 0; index < path.length; index += 1) {
      const segment = path[index];
      if (typeof source !== 'object' || source === null || !(segment in source)) break;
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

/**
 * Converts a validated Component API response contract into an HTTP response.
 *
 * @param response - The tagged response contract to encode.
 * @returns A platform response with its corresponding status and JSON body.
 */
export const encodeComponentResponse = (response: ComponentResponse): Response => {
  const encoded = Schema.encodeSync(ComponentResponseSchema)(response);
  return encoded.status === 204
    ? new Response(null, { status: encoded.status })
    : Response.json(encoded.body, { status: encoded.status });
};
