/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect, Schema } from 'effect';

import { HttpError } from './api.schemas';
import {
  ComponentErrorResponseSchema,
  ComponentRecordSchema,
  ComponentTypeSchema,
  FieldsSchema,
} from './api.schemas';

import type { LogMessage } from '@forgerock/sdk-logger';

import type { ComponentStoreError } from '../store/store';

export type AuditFields = { readonly [field: string]: string | ReadonlyArray<string> | undefined };

export const causeDetails = (cause: unknown): LogMessage[] =>
  cause === undefined ? [] : [cause instanceof Error ? cause : String(cause)];

/** Encodes HttpError failures as JSON error responses — the single error boundary per handler. */
export const toResponse = <R>(
  effect: Effect.Effect<Response, HttpError, R>,
): Effect.Effect<Response, never, R> =>
  Effect.catchAll(effect, (error) => {
    const encoded = Schema.encodeSync(ComponentErrorResponseSchema)({
      status: error.status,
      body: { error: error.message },
    });
    return Effect.succeed(Response.json(encoded.body, { status: encoded.status }));
  });

/** Encodes a validated component record as a JSON response that caches must not store. */
export const recordResponse = (
  status: 200 | 201,
  record: typeof ComponentRecordSchema.Type,
): Response =>
  Response.json(Schema.encodeSync(ComponentRecordSchema)(record), {
    status,
    headers: { 'cache-control': 'no-store' },
  });

/** Translates store failures into client-facing HttpErrors. */
export const translateStoreErrors = <Value, R>(
  effect: Effect.Effect<Value, ComponentStoreError, R>,
): Effect.Effect<Value, HttpError, R> =>
  Effect.catchTags(effect, {
    StoreNotFoundError: (error) =>
      Effect.fail(new HttpError({ status: 404, message: error.message })),
    StoreStorageError: (error) =>
      Effect.fail(new HttpError({ status: 500, message: error.message })),
  });

/** Validates a route component type, 404 on unknown values. */
export const validateType = (
  type: string,
): Effect.Effect<typeof ComponentTypeSchema.Type, HttpError> =>
  Effect.mapError(
    Schema.decodeUnknown(ComponentTypeSchema)(type),
    () => new HttpError({ status: 404, message: 'Invalid component type' }),
  );

/** Validates a route component id as a UUID, 400 on non-UUID values. */
export const validateId = (id: string): Effect.Effect<string, HttpError> =>
  Effect.mapError(
    Schema.decodeUnknown(Schema.UUID)(id),
    () => new HttpError({ status: 400, message: 'Invalid component id in URL' }),
  );

/**
 * Parses the `?fields=` query parameter into property-name routes, 400 on invalid fields:
 *
 *   request = GET …/widgets?fields=meta.src, id
 *     → returns [['meta', 'src'], ['id']]
 *
 * Each route is one requested property; the segments walk into it (see fields.utilities).
 */
export const parseFields = (
  request: Request,
): Effect.Effect<ReadonlyArray<ReadonlyArray<string>>, HttpError> => {
  const fieldsInput = new URL(request.url).searchParams.get('fields');
  if (fieldsInput === null || fieldsInput === '') {
    return Effect.succeed([]);
  }
  return Effect.map(
    Effect.mapError(
      Schema.decodeUnknown(FieldsSchema)(fieldsInput),
      () => new HttpError({ status: 400, message: 'Invalid fields parameter' }),
    ),
    (fields) => fields.split(',').map((path) => path.split('.').map((segment) => segment.trim())),
  );
};
