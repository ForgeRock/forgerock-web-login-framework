/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Data, Effect, Schema } from 'effect';

import {
  ComponentErrorResponseSchema,
  ComponentIdSchema,
  ComponentRecordSchema,
  ComponentTypeSchema,
  CreateComponentRequestSchema,
  FieldsSchema,
  MAX_COMPONENT_BUNDLE_SIZE,
  parseFields,
  projectRecord,
  PublishRequestSchema,
  PublishResponseSchema,
  SaveEndpointErrorMessage,
  UpdateComponentRequestSchema,
} from './component-api';
import { type ComponentPublisherService, publishComponent } from './component-publisher';
import {
  ComponentStore,
  type ComponentStoreError,
  type ComponentStoreService,
} from './component-store';
import { ComponentApiRuntime } from './runtime';

import type { Layer } from 'effect';

import type { ComponentPublisherError } from './component-publisher';
import type { ComponentRepoError } from './component-repo';

/** Dependencies that may be overridden when testing Component API handlers. */
export interface ComponentApiDependencies {
  /** Runtime providing component storage and publishing services; defaults to the production composition. */
  readonly runtime?: Layer.Layer<ComponentStoreService | ComponentPublisherService, never, never>;
  /** Production deployments must set this token before exposing component mutation routes. */
  readonly token?: string;
}

/** Encodes a Component API error with its corresponding HTTP status. */
const errorResponse = (
  status: 400 | 401 | 404 | 409 | 413 | 415 | 500,
  error: string,
): Response => {
  const encoded = Schema.encodeSync(ComponentErrorResponseSchema)({ status, body: { error } });
  return Response.json(encoded.body, { status: encoded.status });
};

/** A client-facing HTTP failure raised while validating a component API request. */
class HttpError extends Data.TaggedError('HttpError')<{
  status: 400 | 401 | 404 | 409 | 413 | 415 | 500;
  message: string;
}> {}

/**
 * Encodes a persisted component record as a successful JSON response.
 *
 * @param status - HTTP status for the successful response.
 * @param record - Validated component record to encode.
 * @returns The encoded JSON response.
 */
const recordResponse = (
  status: 200 | 201,
  record: Schema.Schema.Type<typeof ComponentRecordSchema>,
): Response => Response.json(Schema.encodeSync(ComponentRecordSchema)(record), { status });

/**
 * Decodes untrusted input or converts schema failures into a client-facing HTTP error.
 *
 * @param schema - Schema used to decode the input.
 * @param input - Untrusted value to decode.
 * @param message - Error message returned when decoding fails.
 * @returns An effect with the decoded value.
 * @throws {HttpError} When the input does not satisfy the schema.
 */
const decodeOrResponse = <A>(
  schema: Schema.Schema<A>,
  input: unknown,
  message: string,
): Effect.Effect<A, HttpError> =>
  Schema.decodeUnknown(schema)(input).pipe(
    Effect.catchAll(() => Effect.fail(new HttpError({ status: 400, message }))),
  );

/**
 * Extracts request headers used by the component API request guard.
 *
 * @param request - Incoming request whose headers are read.
 * @returns Authentication, content-length, and content-type header values.
 */
const requestHeaders = (request: Request) => ({
  authorization: request.headers.get('authorization'),
  contentLength: request.headers.get('content-length'),
  contentType: request.headers.get('content-type'),
});

/**
 * Enforces optional Bearer-token authentication and JSON body constraints for a request.
 *
 * @param request - Incoming request to validate.
 * @param token - Optional token that must match the request Bearer credential.
 * @param hasBody - Whether the request must declare a JSON body.
 * @returns An effect that completes when the request satisfies all guard policies.
 * @throws {HttpError} When authentication, content type, or body size validation fails.
 */
const guardRequest = (
  request: Request,
  token: string | undefined,
  hasBody: boolean,
): Effect.Effect<void, HttpError> =>
  Effect.sync(() => requestHeaders(request)).pipe(
    Effect.filterOrFail(
      (headers) => token === undefined || headers.authorization === `Bearer ${token}`,
      () => new HttpError({ status: 401, message: SaveEndpointErrorMessage.unauthorized }),
    ),
    Effect.filterOrFail(
      (headers) =>
        !hasBody ||
        headers.contentType?.split(';', 1)[0]?.trim().toLowerCase() === 'application/json',
      () => new HttpError({ status: 415, message: SaveEndpointErrorMessage.invalidContentType }),
    ),
    Effect.filterOrFail(
      (headers) => {
        const length = headers.contentLength === null ? undefined : Number(headers.contentLength);
        return (
          length === undefined || !Number.isFinite(length) || length <= MAX_COMPONENT_BUNDLE_SIZE
        );
      },
      () => new HttpError({ status: 413, message: SaveEndpointErrorMessage.bundleTooLarge }),
    ),
    Effect.asVoid,
  );

/**
 * Reads, size-limits, and decodes a JSON request body.
 *
 * @param request - Incoming request whose body is read.
 * @param schema - Schema used to parse and validate the JSON body.
 * @returns An effect with the decoded request body.
 * @throws {HttpError} When the body cannot be read, exceeds the limit, or is invalid JSON.
 */
const readBody = <A>(request: Request, schema: Schema.Schema<A>): Effect.Effect<A, HttpError> =>
  Effect.tryPromise({
    try: () => request.text(),
    catch: () => new HttpError({ status: 400, message: 'Unable to read component request body' }),
  }).pipe(
    Effect.filterOrFail(
      (body) => body.length <= MAX_COMPONENT_BUNDLE_SIZE,
      () => new HttpError({ status: 413, message: SaveEndpointErrorMessage.bundleTooLarge }),
    ),
    Effect.flatMap((body) =>
      Schema.decodeUnknown(Schema.parseJson(schema))(body).pipe(
        Effect.catchAll(() =>
          Effect.fail(new HttpError({ status: 400, message: 'Invalid request body' })),
        ),
      ),
    ),
  );

/**
 * Maps a component store failure to its client-facing HTTP equivalent.
 *
 * @param error - Tagged component store failure to translate.
 * @returns The corresponding HTTP error.
 */
const storeHttpError = (error: ComponentStoreError): HttpError =>
  new HttpError({
    status:
      error.reason === 'NotFound'
        ? 404
        : error.reason === 'Conflict'
        ? 409
        : error.reason === 'Storage'
        ? 500
        : 400,
    message: error.message,
  });

/**
 * Supplies a component store effect with the production or test runtime.
 *
 * @param effect - Effect requiring the component store service.
 * @param dependencies - Optional handler dependency overrides.
 * @returns The effect with its store requirement satisfied.
 */
const provideStore = <A, E>(
  effect: Effect.Effect<A, E, ComponentStoreService>,
  dependencies: ComponentApiDependencies,
): Effect.Effect<A, E> => effect.pipe(Effect.provide(dependencies.runtime ?? ComponentApiRuntime));

/**
 * Supplies a component publisher effect with the production or test runtime.
 *
 * @param effect - Effect requiring the component publisher service.
 * @param dependencies - Optional handler dependency overrides.
 * @returns The effect with its publisher requirement satisfied.
 */
const providePublisher = <A, E>(
  effect: Effect.Effect<A, E, ComponentPublisherService>,
  dependencies: ComponentApiDependencies,
): Effect.Effect<A, E> => effect.pipe(Effect.provide(dependencies.runtime ?? ComponentApiRuntime));

/**
 * Validates a route component type.
 *
 * @param type - Untrusted component type from the route path.
 * @returns An effect with the validated component type.
 * @throws {HttpError} When the type is not supported.
 */
const validateType = (type: string): Effect.Effect<string, HttpError> =>
  Schema.decodeUnknown(ComponentTypeSchema)(type).pipe(
    Effect.catchAll(() =>
      Effect.fail(
        new HttpError({ status: 404, message: SaveEndpointErrorMessage.invalidComponentType }),
      ),
    ),
  );

/**
 * Validates a route component id.
 *
 * @param id - Untrusted component id from the route path.
 * @returns An effect with the validated component id.
 * @throws {HttpError} When the id is not a supported component UUID.
 */
const validateId = (id: string): Effect.Effect<string, HttpError> =>
  Schema.decodeUnknown(ComponentIdSchema)(id).pipe(
    Effect.catchAll(() =>
      Effect.fail(
        new HttpError({ status: 400, message: SaveEndpointErrorMessage.invalidComponentId }),
      ),
    ),
  );

/**
 * Catches HttpError failures in the effect and encodes them as HTTP Responses — the single
 * error-boundary per handler.
 *
 * @param effect - Response-producing effect that may fail with an HTTP error.
 * @returns The same response effect with its HTTP error channel handled.
 */
const toResponse = <R>(
  effect: Effect.Effect<Response, HttpError, R>,
): Effect.Effect<Response, never, R> =>
  effect.pipe(
    Effect.catchTag('HttpError', (error) =>
      Effect.succeed(errorResponse(error.status, error.message)),
    ),
  );

/**
 * Lists component records for a route type, optionally projecting requested fields.
 *
 * @param request - Incoming request, whose `fields` query parameter selects record properties.
 * @param type - Component category from the route path.
 * @param dependencies - Optional runtime override and `COMPONENT_SAVE_TOKEN` equivalent for tests.
 * @returns An effect resolving to 200 records, 400 for invalid fields, 401 for an invalid Bearer token,
 * or 404 for an invalid type; storage failures produce 409 or 500.
 * @throws {ComponentStoreError} Is caught and encoded as its corresponding HTTP error response.
 */
export const listComponents = (
  request: Request,
  type: string,
  dependencies: ComponentApiDependencies = {},
): Effect.Effect<Response> =>
  toResponse(
    Effect.gen(function* () {
      yield* guardRequest(request, dependencies.token, false);
      const validType = yield* validateType(type);
      const fields = yield* decodeOrResponse(
        FieldsSchema,
        new URL(request.url).searchParams.get('fields') ?? '',
        SaveEndpointErrorMessage.invalidFields,
      );
      return yield* ComponentStore.pipe(
        Effect.flatMap((store) => store.list(validType)),
        Effect.map((records) =>
          Response.json(records.map((record) => projectRecord(record, parseFields(fields)))),
        ),
        Effect.catchTag('ComponentStoreError', (error) => Effect.fail(storeHttpError(error))),
        (effect) => provideStore(effect, dependencies),
      );
    }),
  );

/**
 * Retrieves a component record by its route type and id.
 *
 * @param request - Incoming request used for optional Bearer-token validation.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path.
 * @param dependencies - Optional runtime override and `COMPONENT_SAVE_TOKEN` equivalent for tests.
 * @returns An effect resolving to 200 with the record, 400 for an invalid id, 401 for an invalid Bearer
 * token, 404 for an invalid type or missing record, or 409/500 for storage failures.
 * @throws {ComponentStoreError} Is caught and encoded as its corresponding HTTP error response.
 */
export const getComponent = (
  request: Request,
  type: string,
  id: string,
  dependencies: ComponentApiDependencies = {},
): Effect.Effect<Response> =>
  withRecord(request, type, id, dependencies, (store, validType, validId) =>
    store.get(validType, validId).pipe(Effect.map((record) => recordResponse(200, record))),
  );

/**
 * Runs a record operation after enforcing request, type, and id policies.
 *
 * @param request - Incoming request to guard.
 * @param type - Untrusted component type from the route path.
 * @param id - Untrusted component id from the route path.
 * @param dependencies - Optional handler dependency overrides.
 * @param operation - Store operation to run with validated route values.
 * @returns A response effect that encodes all HTTP failures at the handler boundary.
 */
const withRecord = (
  request: Request,
  type: string,
  id: string,
  dependencies: ComponentApiDependencies,
  operation: (
    store: ComponentStoreService,
    type: string,
    id: string,
  ) => Effect.Effect<Response, ComponentStoreError>,
): Effect.Effect<Response> =>
  toResponse(
    Effect.gen(function* () {
      const hasBody = request.method === 'POST' || request.method === 'PUT';
      yield* guardRequest(request, dependencies.token, hasBody);
      const validType = yield* validateType(type);
      const validId = yield* validateId(id);
      return yield* ComponentStore.pipe(
        Effect.flatMap((store) => operation(store, validType, validId)),
        Effect.catchTag('ComponentStoreError', (error) => Effect.fail(storeHttpError(error))),
        (effect) => provideStore(effect, dependencies),
      );
    }),
  );

/**
 * Creates a component record in the requested route type.
 *
 * @param request - JSON request containing the client-editable component fields.
 * @param type - Component category from the route path.
 * @param dependencies - Optional runtime override and `COMPONENT_SAVE_TOKEN` equivalent for tests.
 * @returns An effect resolving to 201 with the created record; 400 for malformed input, 401 for an
 * invalid Bearer token, 404 for an invalid type, 413 for an oversized body, 415 for non-JSON,
 * or 409/500 for storage failures.
 * @throws {ComponentStoreError} Is caught and encoded as its corresponding HTTP error response.
 */
export const createComponent = (
  request: Request,
  type: string,
  dependencies: ComponentApiDependencies = {},
): Effect.Effect<Response> =>
  toResponse(
    Effect.gen(function* () {
      yield* guardRequest(request, dependencies.token, true);
      const validType = yield* validateType(type);
      const body = yield* readBody(request, CreateComponentRequestSchema);
      return yield* ComponentStore.pipe(
        Effect.flatMap((store) =>
          store.create(validType, body).pipe(Effect.map((record) => recordResponse(201, record))),
        ),
        Effect.catchTag('ComponentStoreError', (error) => Effect.fail(storeHttpError(error))),
        (effect) => provideStore(effect, dependencies),
      );
    }),
  );

/**
 * Updates an existing component record without creating a missing record.
 *
 * @param request - JSON request containing the replacement client-editable component fields.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path and optional body-id consistency check.
 * @param dependencies - Optional runtime override and `COMPONENT_SAVE_TOKEN` equivalent for tests.
 * @returns An effect resolving to 200 with the updated record; 400 for malformed input or mismatched id,
 * 401 for an invalid Bearer token, 404 for an invalid type or missing record, 413 for an oversized
 * body, 415 for non-JSON, or 409/500 for storage failures.
 * @throws {ComponentStoreError} Is caught and encoded as its corresponding HTTP error response.
 */
export const updateComponent = (
  request: Request,
  type: string,
  id: string,
  dependencies: ComponentApiDependencies = {},
): Effect.Effect<Response> =>
  toResponse(
    Effect.gen(function* () {
      yield* guardRequest(request, dependencies.token, true);
      const validType = yield* validateType(type);
      const validId = yield* validateId(id);
      const body = yield* readBody(request, UpdateComponentRequestSchema);
      if (body.id !== undefined && body.id !== validId) {
        return yield* Effect.fail(
          new HttpError({ status: 400, message: SaveEndpointErrorMessage.invalidComponentId }),
        );
      }
      return yield* ComponentStore.pipe(
        Effect.flatMap((store) =>
          store
            .update(validType, validId, body)
            .pipe(Effect.map((record) => recordResponse(200, record))),
        ),
        Effect.catchTag('ComponentStoreError', (error) => Effect.fail(storeHttpError(error))),
        (effect) => provideStore(effect, dependencies),
      );
    }),
  );

/**
 * Deletes an existing component record.
 *
 * @param request - Incoming request used for `COMPONENT_SAVE_TOKEN` Bearer-token validation.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path.
 * @param dependencies - Optional runtime override and `COMPONENT_SAVE_TOKEN` equivalent for tests.
 * @returns An effect resolving to 204 with no body, 400 for an invalid id, 401 for an invalid Bearer
 * token, 404 for an invalid type or missing record, or 409/500 for storage failures.
 * @throws {ComponentStoreError} Is caught and encoded as its corresponding HTTP error response.
 */
export const deleteComponent = (
  request: Request,
  type: string,
  id: string,
  dependencies: ComponentApiDependencies = {},
): Effect.Effect<Response> =>
  withRecord(request, type, id, dependencies, (store, validType, validId) =>
    store.delete(validType, validId).pipe(Effect.as(new Response(null, { status: 204 }))),
  );

/**
 * Publishes component source code and optional files as a repository bundle.
 *
 * @param request - JSON request containing bundle code and optional additional files.
 * @param dependencies - Optional runtime override and `COMPONENT_SAVE_TOKEN` equivalent for tests.
 * @returns An effect resolving to 200 with the published bundle reference; 400 for malformed input or
 * publisher rejection, 401 for an invalid Bearer token, 413 for an oversized body, 415 for non-JSON,
 * or 500 when repository persistence fails.
 * @throws {ComponentPublisherError} Is caught and encoded as a 400 response.
 * @throws {ComponentRepoError} Is caught and encoded as a 500 response.
 */
export const publishComponentSource = (
  request: Request,
  dependencies: ComponentApiDependencies = {},
): Effect.Effect<Response> =>
  toResponse(
    Effect.gen(function* () {
      yield* guardRequest(request, dependencies.token, true);
      const body = yield* readBody(request, PublishRequestSchema);
      const bundle = JSON.stringify({
        files: [...(body.files ?? []), { path: 'bundle.js', content: body.code }],
      });
      return yield* publishComponent(bundle).pipe(
        Effect.as(
          Response.json(
            Schema.encodeSync(PublishResponseSchema)({ id: crypto.randomUUID(), url: '' }),
          ),
        ),
        Effect.catchTag('ComponentPublisherError', (error: ComponentPublisherError) =>
          Effect.fail(new HttpError({ status: 400, message: error.message })),
        ),
        Effect.catchTag('ComponentRepoError', (error: ComponentRepoError) =>
          Effect.fail(new HttpError({ status: 500, message: error.message })),
        ),
        (effect) => providePublisher(effect, dependencies),
      );
    }),
  );
