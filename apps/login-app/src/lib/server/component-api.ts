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

/**
 * Represents an invalid `fields` query projection.
 *
 * **When to use**
 *
 * Use when a comma-separated projection contains an empty path segment.
 *
 * @category errors
 */
export class InvalidFieldsError extends Data.TaggedError('InvalidFieldsError')<{
  readonly message: string;
}> {}

/**
 * Parses a `fields` query parameter into immutable dot-notation paths.
 *
 * **When to use**
 *
 * Use at the HTTP boundary before projecting component records. A missing or blank
 * projection represents the complete record.
 *
 * **Example** (Projecting nested fields)
 *
 * ```ts
 * const fields = yield* parseFields("id,meta.displayName")
 * // [["id"], ["meta", "displayName"]]
 * ```
 *
 * @see {@link projectRecord} for applying parsed paths to a record.
 * @category parsing
 *
 * @param input - A comma-separated projection, or `null` when it is absent.
 * @returns An effect yielding paths, or `InvalidFieldsError` for an invalid projection.
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
 * Projects a record to contain only requested top-level or nested paths.
 *
 * **When to use**
 *
 * Use after {@link parseFields} has accepted a client-supplied projection.
 *
 * **Gotchas**
 *
 * An empty path list returns a shallow copy of the complete record. Nested objects
 * referenced by that copy are not cloned.
 *
 * **Example** (Selecting a nested property)
 *
 * ```ts
 * projectRecord({ id: "1", meta: { name: "Login" } }, [["meta", "name"]])
 * // { meta: { name: "Login" } }
 * ```
 *
 * @see {@link parseFields} for parsing a query parameter into paths.
 * @category transformations
 *
 * @param record - The source component record.
 * @param fields - Parsed projection paths; no paths retain the full record.
 * @returns A new projected record.
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
 * Encodes a validated Component API response contract as a platform response.
 *
 * **When to use**
 *
 * Use at a route boundary after an operation has constructed a tagged API response.
 *
 * **Example** (Encoding a successful response)
 *
 * ```ts
 * const response = encodeComponentResponse({ status: 204, body: undefined })
 * ```
 *
 * @category encoding
 *
 * @param response - The tagged response contract to encode.
 * @returns A platform response with the contract's status and JSON body.
 */
export const encodeComponentResponse = (response: ComponentResponse): Response => {
  const encoded = Schema.encodeSync(ComponentResponseSchema)(response);
  return encoded.status === 204
    ? new Response(null, { status: encoded.status })
    : Response.json(encoded.body, { status: encoded.status });
};
