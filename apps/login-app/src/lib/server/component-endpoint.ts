/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect, Schema } from 'effect';

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
const errorResponse = (status: 400 | 401 | 404 | 413 | 415 | 500, error: string): Response => {
  const encoded = Schema.encodeSync(ComponentErrorResponseSchema)({ status, body: { error } });
  return Response.json(encoded.body, { status: encoded.status });
};

const recordResponse = (
  status: 200 | 201,
  record: Schema.Schema.Type<typeof ComponentRecordSchema>,
): Response => Response.json(Schema.encodeSync(ComponentRecordSchema)(record), { status });

const decodeOrResponse = <A>(
  schema: Schema.Schema<A>,
  input: unknown,
  message: string,
): Effect.Effect<A | Response> =>
  Schema.decodeUnknown(schema)(input).pipe(
    Effect.match({ onFailure: () => errorResponse(400, message), onSuccess: (value) => value }),
  );

const requestHeaders = (request: Request) => ({
  authorization: request.headers.get('authorization'),
  contentLength: request.headers.get('content-length'),
  contentType: request.headers.get('content-type'),
});

/** Enforces optional Bearer-token authentication and JSON body constraints for a request. */
const guardRequest = (
  request: Request,
  token: string | undefined,
  hasBody: boolean,
): Effect.Effect<Response | void> =>
  Effect.sync(() => {
    const headers = requestHeaders(request);
    if (token !== undefined && headers.authorization !== `Bearer ${token}`) {
      return errorResponse(401, SaveEndpointErrorMessage.unauthorized);
    }
    if (!hasBody) return undefined;
    if (headers.contentType?.split(';', 1)[0]?.trim().toLowerCase() !== 'application/json') {
      return errorResponse(415, SaveEndpointErrorMessage.invalidContentType);
    }
    const length = headers.contentLength === null ? undefined : Number(headers.contentLength);
    if (length !== undefined && Number.isFinite(length) && length > MAX_COMPONENT_BUNDLE_SIZE) {
      return errorResponse(413, SaveEndpointErrorMessage.bundleTooLarge);
    }
    return undefined;
  });

/** Reads, size-limits, and decodes a JSON request body or returns its client-error response. */
const readBody = <A>(request: Request, schema: Schema.Schema<A>): Effect.Effect<A | Response> =>
  Effect.tryPromise({
    try: () => request.text(),
    catch: () => new Error('Unable to read component request body'),
  }).pipe(
    Effect.match({
      onFailure: () => errorResponse(400, 'Unable to read component request body'),
      onSuccess: (body) => body,
    }),
    Effect.flatMap((body) =>
      body instanceof Response
        ? Effect.succeed(body)
        : body.length > MAX_COMPONENT_BUNDLE_SIZE
        ? Effect.succeed(errorResponse(413, SaveEndpointErrorMessage.bundleTooLarge))
        : Schema.decodeUnknown(Schema.parseJson(schema))(body).pipe(
            Effect.match({
              onFailure: () => errorResponse(400, 'Invalid request body'),
              onSuccess: (value) => value,
            }),
          ),
    ),
  );

const storeErrorResponse = (error: ComponentStoreError): Response => {
  const status =
    error.reason === 'NotFound'
      ? 404
      : error.reason === 'Conflict'
      ? 409
      : error.reason === 'Storage'
      ? 500
      : 400;
  const encoded = Schema.encodeSync(ComponentErrorResponseSchema)({
    status,
    body: { error: error.message },
  });
  return Response.json(encoded.body, { status: encoded.status });
};

const provideStore = <A, E>(
  effect: Effect.Effect<A, E, ComponentStoreService>,
  dependencies: ComponentApiDependencies,
): Effect.Effect<A, E> => effect.pipe(Effect.provide(dependencies.runtime ?? ComponentApiRuntime));

const providePublisher = <A, E>(
  effect: Effect.Effect<A, E, ComponentPublisherService>,
  dependencies: ComponentApiDependencies,
): Effect.Effect<A, E> => effect.pipe(Effect.provide(dependencies.runtime ?? ComponentApiRuntime));

/** Validates a route component type or returns a 404 response. */
const validateType = (type: string): Effect.Effect<string | Response> =>
  Schema.decodeUnknown(ComponentTypeSchema)(type).pipe(
    Effect.match({
      onFailure: () => errorResponse(404, SaveEndpointErrorMessage.invalidComponentType),
      onSuccess: (value) => value,
    }),
  );

/** Validates a route component id or returns a 400 response. */
const validateId = (id: string): Effect.Effect<string | Response> =>
  Schema.decodeUnknown(ComponentIdSchema)(id).pipe(
    Effect.match({
      onFailure: () => errorResponse(400, SaveEndpointErrorMessage.invalidComponentId),
      onSuccess: (value) => value,
    }),
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
  Effect.gen(function* () {
    const guard = yield* guardRequest(request, dependencies.token, false);
    if (guard instanceof Response) return guard;
    const validType = yield* validateType(type);
    if (validType instanceof Response) return validType;
    const fields = yield* decodeOrResponse(
      FieldsSchema,
      new URL(request.url).searchParams.get('fields') ?? '',
      SaveEndpointErrorMessage.invalidFields,
    );
    if (fields instanceof Response) return fields;
    return yield* ComponentStore.pipe(
      Effect.flatMap((store) => store.list(validType)),
      Effect.map((records) =>
        Response.json(records.map((record) => projectRecord(record, parseFields(fields)))),
      ),
      Effect.catchTag('ComponentStoreError', (error) => Effect.succeed(storeErrorResponse(error))),
      (effect) => provideStore(effect, dependencies),
    );
  });

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

/** Runs a record operation after enforcing request, type, and id policies. */
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
  Effect.gen(function* () {
    const hasBody = request.method === 'POST' || request.method === 'PUT';
    const guard = yield* guardRequest(request, dependencies.token, hasBody);
    if (guard instanceof Response) return guard;
    const validType = yield* validateType(type);
    if (validType instanceof Response) return validType;
    const validId = yield* validateId(id);
    if (validId instanceof Response) return validId;
    return yield* ComponentStore.pipe(
      Effect.flatMap((store) => operation(store, validType, validId)),
      Effect.catchTag('ComponentStoreError', (error) => Effect.succeed(storeErrorResponse(error))),
      (effect) => provideStore(effect, dependencies),
    );
  });

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
  Effect.gen(function* () {
    const guard = yield* guardRequest(request, dependencies.token, true);
    if (guard instanceof Response) return guard;
    const validType = yield* validateType(type);
    if (validType instanceof Response) return validType;
    const body = yield* readBody(request, CreateComponentRequestSchema);
    if (body instanceof Response) return body;
    return yield* ComponentStore.pipe(
      Effect.flatMap((store) =>
        store.create(validType, body).pipe(Effect.map((record) => recordResponse(201, record))),
      ),
      Effect.catchTag('ComponentStoreError', (error) => Effect.succeed(storeErrorResponse(error))),
      (effect) => provideStore(effect, dependencies),
    );
  });

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
  Effect.gen(function* () {
    const guard = yield* guardRequest(request, dependencies.token, true);
    if (guard instanceof Response) return guard;
    const validType = yield* validateType(type);
    if (validType instanceof Response) return validType;
    const validId = yield* validateId(id);
    if (validId instanceof Response) return validId;
    const body = yield* readBody(request, UpdateComponentRequestSchema);
    if (body instanceof Response) return body;
    if (body.id !== undefined && body.id !== validId)
      return errorResponse(400, SaveEndpointErrorMessage.invalidComponentId);
    return yield* ComponentStore.pipe(
      Effect.flatMap((store) =>
        store
          .update(validType, validId, body)
          .pipe(Effect.map((record) => recordResponse(200, record))),
      ),
      Effect.catchTag('ComponentStoreError', (error) => Effect.succeed(storeErrorResponse(error))),
      (effect) => provideStore(effect, dependencies),
    );
  });

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
  Effect.gen(function* () {
    const guard = yield* guardRequest(request, dependencies.token, true);
    if (guard instanceof Response) return guard;
    const body = yield* readBody(request, PublishRequestSchema);
    if (body instanceof Response) return body;
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
        Effect.succeed(errorResponse(400, error.message)),
      ),
      Effect.catchTag('ComponentRepoError', (error: ComponentRepoError) =>
        Effect.succeed(errorResponse(500, error.message)),
      ),
      (effect) => providePublisher(effect, dependencies),
    );
  });
