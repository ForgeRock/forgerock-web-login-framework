/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Data, Effect, Schema } from 'effect';

import { ComponentAuth, type ComponentAuthError, type ComponentAuthService } from './auth';
import {
  COMPONENT_BUNDLE_SIZE_MESSAGE,
  ComponentErrorResponseSchema,
  ComponentIdSchema,
  ComponentRecordSchema,
  type ComponentType,
  ComponentTypeSchema,
  CreateComponentRequestSchema,
  FieldsSchema,
  MAX_COMPONENT_BUNDLE_SIZE,
  parseFields,
  projectRecord,
  PublishRequestSchema,
  UpdateComponentRequestSchema,
} from './fields.utils';
import { publishBundle, publishComponent, publishResponse } from './publisher';
import { ComponentStore, type ComponentStoreError, type ComponentStoreService } from './records';

import type { FileSyncError } from './file-sync';
import type { ComponentPublisherError, ComponentPublisherService } from './publisher';
import type { ComponentRepoError } from './repo';

/** HTTP statuses representable in Component API error responses. */
type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 413 | 415 | 500;

/**
 * A client-facing HTTP failure raised while handling a Component API request. Handler entry
 * points catch this error and encode it as the response's status and JSON error body.
 */
export class HttpError extends Data.TaggedError('HttpError')<{
  status: ApiErrorStatus;
  message: string;
}> {}

/**
 * Whether this deployment serves the Component API. Disabled unless the deployment sets
 * `COMPONENT_API_ENABLED=true`, so production tenants running the same build stay login-only.
 */
export const isComponentApiEnabled = (): boolean => process.env.COMPONENT_API_ENABLED === 'true';

/** Encodes an error body as a JSON response. */
const errorResponse = (status: ApiErrorStatus, error: string): Response => {
  const encoded = Schema.encodeSync(ComponentErrorResponseSchema)({ status, body: { error } });
  return Response.json(encoded.body, { status: encoded.status });
};

/** Encodes a validated component record as a JSON response. */
const recordResponse = (
  status: 200 | 201,
  record: Schema.Schema.Type<typeof ComponentRecordSchema>,
): Response => Response.json(Schema.encodeSync(ComponentRecordSchema)(record), { status });

/** Maps an authentication failure to its client-facing HTTP error. */
const authHttpError = (error: ComponentAuthError): HttpError =>
  new HttpError({
    status: error.reason === 'Unauthenticated' ? 401 : error.reason === 'Forbidden' ? 403 : 500,
    message: error.message,
  });

/** Maps a record-storage failure to its client-facing HTTP error. */
const storeHttpError = (error: ComponentStoreError): HttpError =>
  new HttpError({
    status: error.reason === 'NotFound' ? 404 : error.reason === 'Storage' ? 500 : 400,
    message: error.message,
  });

/** Catches HttpError failures and encodes them as HTTP responses. */
const toResponse = <R>(
  effect: Effect.Effect<Response, HttpError, R>,
): Effect.Effect<Response, never, R> =>
  effect.pipe(
    Effect.catchTag('HttpError', (error) =>
      Effect.succeed(errorResponse(error.status, error.message)),
    ),
  );

/** Reads a request's content type and declared body length. */
const requestHeaders = (request: Request) => ({
  contentType: request.headers.get('content-type'),
  contentLength: request.headers.get('content-length'),
});

/**
 * Enforces API enablement (`COMPONENT_API_ENABLED=true`), AM admin authentication, JSON content
 * type, and the declared body size limit. Disabled deployments 404; authentication fails closed.
 */
const guardRequest = (
  request: Request,
  hasBody: boolean,
): Effect.Effect<void, HttpError, ComponentAuthService> =>
  Effect.flatMap(Effect.sync(isComponentApiEnabled), (enabled) =>
    enabled ? Effect.void : Effect.fail(new HttpError({ status: 404, message: 'Not found' })),
  ).pipe(
    Effect.flatMap(() => Effect.flatMap(ComponentAuth, (auth) => auth.authenticate(request))),
    Effect.catchTag('ComponentAuthError', (error) => Effect.fail(authHttpError(error))),
    Effect.flatMap(() => Effect.sync(() => requestHeaders(request))),
    Effect.filterOrFail(
      (headers) =>
        !hasBody ||
        headers.contentType?.split(';', 1)[0]?.trim().toLowerCase() === 'application/json',
      () => new HttpError({ status: 415, message: 'Content-Type must be application/json' }),
    ),
    Effect.filterOrFail(
      (headers) => {
        const length = headers.contentLength === null ? undefined : Number(headers.contentLength);
        return (
          length === undefined || !Number.isFinite(length) || length <= MAX_COMPONENT_BUNDLE_SIZE
        );
      },
      () => new HttpError({ status: 413, message: COMPONENT_BUNDLE_SIZE_MESSAGE }),
    ),
    Effect.asVoid,
  );

/** Reads and decodes a size-limited JSON request body. */
const readBody = <A>(request: Request, schema: Schema.Schema<A>): Effect.Effect<A, HttpError> =>
  Effect.tryPromise({
    try: () => request.text(),
    catch: () => new HttpError({ status: 400, message: 'Unable to read component request body' }),
  }).pipe(
    Effect.filterOrFail(
      (body) => body.length <= MAX_COMPONENT_BUNDLE_SIZE,
      () => new HttpError({ status: 413, message: COMPONENT_BUNDLE_SIZE_MESSAGE }),
    ),
    Effect.flatMap((body) =>
      Schema.decodeUnknown(Schema.parseJson(schema))(body).pipe(
        Effect.catchAll(() =>
          Effect.fail(new HttpError({ status: 400, message: 'Invalid request body' })),
        ),
      ),
    ),
  );

/** Validates a route component type, 404 on unknown values. */
const validateType = (type: string): Effect.Effect<ComponentType, HttpError> =>
  Schema.decodeUnknown(ComponentTypeSchema)(type).pipe(
    Effect.catchAll(() =>
      Effect.fail(new HttpError({ status: 404, message: 'Invalid component type' })),
    ),
  );

/** Validates a route component id, 400 on non-UUID values. */
const validateId = (id: string): Effect.Effect<string, HttpError> =>
  Schema.decodeUnknown(ComponentIdSchema)(id).pipe(
    Effect.catchAll(() =>
      Effect.fail(new HttpError({ status: 400, message: 'Invalid component id' })),
    ),
  );

/** Resolves the `?fields=` projection for list requests, 400 on invalid paths. */
const listFieldsProjection = (
  request: Request,
): Effect.Effect<ReadonlyArray<ReadonlyArray<string>>, HttpError> =>
  Schema.decodeUnknown(FieldsSchema)(new URL(request.url).searchParams.get('fields') ?? '').pipe(
    Effect.catchAll(() =>
      Effect.fail(new HttpError({ status: 400, message: 'Invalid fields projection' })),
    ),
    Effect.flatMap(parseFields),
    Effect.catchTag('InvalidFieldsError', (error) =>
      Effect.fail(new HttpError({ status: 400, message: error.message })),
    ),
  );

/** Encodes list records after applying the requested field projection. */
const listResponse = (
  records: ReadonlyArray<Schema.Schema.Type<typeof ComponentRecordSchema>>,
  fields: ReadonlyArray<ReadonlyArray<string>>,
): Response => Response.json(records.map((record) => projectRecord(record, fields)));

/** Maps publisher and persistence failures from a request effect to HTTP responses. */
const publisherHttpErrors = <R>(
  effect: Effect.Effect<Response, ComponentPublisherError | ComponentRepoError | FileSyncError, R>,
): Effect.Effect<Response, HttpError, R> =>
  effect.pipe(
    Effect.catchTag('ComponentPublisherError', (error) =>
      Effect.fail(new HttpError({ status: 400, message: error.message })),
    ),
    Effect.catchTag('ComponentRepoError', (error) =>
      Effect.fail(new HttpError({ status: 500, message: error.message })),
    ),
    Effect.catchTag('FileSyncError', (error) =>
      Effect.fail(new HttpError({ status: 500, message: error.message })),
    ),
  );

/**
 * Shared skeleton for every Component API handler: guard, optional body decode, operation,
 * store-error mapping, and response encoding.
 */
const handler = <R, Body>(
  request: Request,
  hasBody: boolean,
  bodySchema: Schema.Schema<Body> | undefined,
  operation: (context: {
    store: ComponentStoreService;
    body: Body | undefined;
  }) => Effect.Effect<Response, ComponentStoreError | HttpError, R>,
): Effect.Effect<Response, never, R | ComponentAuthService | ComponentStoreService> =>
  toResponse(
    Effect.gen(function* () {
      yield* guardRequest(request, hasBody);
      const body = bodySchema === undefined ? undefined : yield* readBody(request, bodySchema);
      return yield* ComponentStore.pipe(
        Effect.flatMap((store) =>
          operation({ store, body }).pipe(
            Effect.catchTag('ComponentStoreError', (error) => Effect.fail(storeHttpError(error))),
          ),
        ),
      );
    }),
  );

/**
 * Lists component records for a route type, optionally projecting fields from the `?fields=`
 * query parameter.
 *
 * @param request - Incoming request with an optional `fields` query parameter.
 * @param type - Component category from the route path.
 * @returns An effect resolving to 200 with records; 400 for invalid fields, 401 for an
 * unauthenticated caller, 403 for a non-admin session, 404 when the API is disabled or the
 * type is invalid, or 500 for storage failures.
 */
export const listComponents = (
  request: Request,
  type: string,
): Effect.Effect<Response, never, ComponentStoreService | ComponentAuthService> =>
  toResponse(
    Effect.gen(function* () {
      yield* guardRequest(request, false);
      const validType = yield* validateType(type);
      const parsedFields = yield* listFieldsProjection(request);
      return yield* ComponentStore.pipe(
        Effect.flatMap((store) =>
          store.list(validType).pipe(Effect.map((records) => listResponse(records, parsedFields))),
        ),
        Effect.catchTag('ComponentStoreError', (error) => Effect.fail(storeHttpError(error))),
      );
    }),
  );

/**
 * Retrieves a component record by its route type and id.
 *
 * @param request - Incoming request.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path.
 * @returns An effect resolving to 200 with the record; 400 for an invalid id, 401 for an
 * unauthenticated caller, 403 for a non-admin session, 404 when the API is disabled, the type
 * is invalid, or the record is missing, or 500 for storage failures.
 */
export const getComponent = (
  request: Request,
  type: string,
  id: string,
): Effect.Effect<Response, never, ComponentStoreService | ComponentAuthService> =>
  handler(request, false, undefined, ({ store }) =>
    Effect.gen(function* () {
      const validType = yield* validateType(type);
      const validId = yield* validateId(id);
      const record = yield* store.get(validType, validId);
      return recordResponse(200, record);
    }),
  );

/**
 * Creates a component record in the requested route type.
 *
 * @param request - JSON request containing the client-editable component fields.
 * @param type - Component category from the route path.
 * @returns An effect resolving to 201 with the created record; 400 for malformed input,
 * 401 for an unauthenticated caller, 403 for a non-admin session, 404 when the API is disabled
 * or the type is invalid, 413 for an oversized body, 415 for non-JSON, or 500 for storage
 * failures.
 */
export const createComponent = (
  request: Request,
  type: string,
): Effect.Effect<Response, never, ComponentStoreService | ComponentAuthService> =>
  handler(request, true, CreateComponentRequestSchema, ({ store, body }) =>
    Effect.gen(function* () {
      const validType = yield* validateType(type);
      const record = yield* store.create(validType, body!);
      return recordResponse(201, record);
    }),
  );

/**
 * Updates an existing component record without creating a missing record, preserving its
 * creation date.
 *
 * @param request - JSON request containing the replacement client-editable component fields.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path; a body id must match it.
 * @returns An effect resolving to 200 with the updated record; 400 for malformed input or a
 * mismatched body id, 401 for an unauthenticated caller, 403 for a non-admin session, 404 when
 * the API is disabled, the type is invalid, or the record is missing, 413 for an oversized body,
 * 415 for non-JSON, or 500 for storage failures.
 */
export const updateComponent = (
  request: Request,
  type: string,
  id: string,
): Effect.Effect<Response, never, ComponentStoreService | ComponentAuthService> =>
  handler(request, true, UpdateComponentRequestSchema, ({ store, body }) =>
    Effect.gen(function* () {
      const validType = yield* validateType(type);
      const validId = yield* validateId(id);
      if (body!.id !== undefined && body!.id !== validId) {
        return yield* Effect.fail(new HttpError({ status: 400, message: 'Invalid component id' }));
      }
      const record = yield* store.update(validType, validId, body!);
      return recordResponse(200, record);
    }),
  );

/**
 * Deletes an existing component record.
 *
 * @param request - Incoming request.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path.
 * @returns An effect resolving to 204 with no body; 400 for an invalid id, 401 for an
 * unauthenticated caller, 403 for a non-admin session, 404 when the API is disabled, the type
 * is invalid, or the record is missing, or 500 for storage failures.
 */
export const deleteComponent = (
  request: Request,
  type: string,
  id: string,
): Effect.Effect<Response, never, ComponentStoreService | ComponentAuthService> =>
  handler(request, false, undefined, ({ store }) =>
    Effect.gen(function* () {
      const validType = yield* validateType(type);
      const validId = yield* validateId(id);
      yield* store.delete(validType, validId);
      return new Response(null, { status: 204 });
    }),
  );

/**
 * Publishes component source code and optional files as a repository bundle.
 *
 * @param request - JSON request containing bundle code and optional additional files.
 * @returns An effect resolving to 200 with the published bundle reference; 400 for malformed
 * input or publisher rejection, 401 for an unauthenticated caller, 403 for a non-admin session,
 * 413 for an oversized body, 415 for non-JSON, or 500 when repository persistence fails.
 */
export const publishComponentSource = (
  request: Request,
): Effect.Effect<Response, never, ComponentPublisherService | ComponentAuthService> =>
  toResponse(
    Effect.gen(function* () {
      yield* guardRequest(request, true);
      const body = yield* readBody(request, PublishRequestSchema);
      const bundle = publishBundle(body);
      return yield* publisherHttpErrors(
        publishComponent(bundle).pipe(Effect.as(publishResponse())),
      );
    }),
  );
