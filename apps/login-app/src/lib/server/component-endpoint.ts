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
  readonly runtime?: Layer.Layer<ComponentStoreService | ComponentPublisherService, never, never>;
  /** Production deployments must set this token before exposing component mutation routes. */
  readonly token?: string;
}

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

const validateType = (type: string): Effect.Effect<string | Response> =>
  Schema.decodeUnknown(ComponentTypeSchema)(type).pipe(
    Effect.match({
      onFailure: () => errorResponse(404, SaveEndpointErrorMessage.invalidComponentType),
      onSuccess: (value) => value,
    }),
  );

const validateId = (id: string): Effect.Effect<string | Response> =>
  Schema.decodeUnknown(ComponentIdSchema)(id).pipe(
    Effect.match({
      onFailure: () => errorResponse(400, SaveEndpointErrorMessage.invalidComponentId),
      onSuccess: (value) => value,
    }),
  );

/** Lists component records, optionally selecting fields from each record. */
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

/** Retrieves a component record by type and id. */
export const getComponent = (
  request: Request,
  type: string,
  id: string,
  dependencies: ComponentApiDependencies = {},
): Effect.Effect<Response> =>
  withRecord(request, type, id, dependencies, (store, validType, validId) =>
    store.get(validType, validId).pipe(Effect.map((record) => recordResponse(200, record))),
  );

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

/** Creates a component record. */
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

/** Updates an existing component record without creating a missing record. */
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

/** Deletes a component record. */
export const deleteComponent = (
  request: Request,
  type: string,
  id: string,
  dependencies: ComponentApiDependencies = {},
): Effect.Effect<Response> =>
  withRecord(request, type, id, dependencies, (store, validType, validId) =>
    store.delete(validType, validId).pipe(Effect.as(new Response(null, { status: 204 }))),
  );

/** Publishes component source code and optional files as a repository bundle. */
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
