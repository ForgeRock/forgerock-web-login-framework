/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Data, Effect, Schema } from 'effect';

import { ComponentAuth, type ComponentAuthService } from './auth';
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
  projectRecord,
  PublishRequestSchema,
  UpdateComponentRequestSchema,
} from './fields.utils';
import { publishBundle, publishComponent, publishResponse } from './publisher';
import { ComponentStore, type ComponentStoreError, type ComponentStoreService } from './records';

import type { ComponentPublisherService } from './publisher';

/** HTTP statuses representable in Component API error responses. */
type ApiErrorStatus = 400 | 401 | 403 | 404 | 413 | 415 | 500;

/**
 * A client-facing HTTP failure raised while handling a Component API request. Handler entry
 * points catch this error and encode it as the response's status and JSON error body.
 */
export class HttpError extends Data.TaggedError('HttpError')<{
  status: ApiErrorStatus;
  message: string;
}> {}

/** Whether this deployment serves the Component API. Disabled deployments 404 every route. */
export const isComponentApiEnabled = (): boolean => process.env.COMPONENT_API_ENABLED === 'true';

/** Maps an error tag to the HTTP status a client should see. */
const AUTH_STATUS = { Unauthenticated: 401, Forbidden: 403, Unavailable: 500 } as const;

const STORE_STATUS = { NotFound: 404, Storage: 500, InvalidType: 400, InvalidId: 400 } as const;

const httpError = (status: ApiErrorStatus, message: string) => new HttpError({ status, message });

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

/** Catches HttpError failures and encodes them as HTTP responses. */
const toResponse = <R>(
  effect: Effect.Effect<Response, HttpError, R>,
): Effect.Effect<Response, never, R> =>
  effect.pipe(
    Effect.catchTag('HttpError', (error) =>
      Effect.succeed(errorResponse(error.status, error.message)),
    ),
  );

/**
 * Enforces API enablement (`COMPONENT_API_ENABLED=true`), AM admin authentication, JSON content
 * type, and the declared body size limit. Disabled deployments 404; authentication fails closed.
 */
const guardRequest = (
  request: Request,
  hasBody: boolean,
): Effect.Effect<void, HttpError, ComponentAuthService> =>
  Effect.flatMap(Effect.sync(isComponentApiEnabled), (enabled) =>
    enabled ? Effect.void : Effect.fail(httpError(404, 'Not found')),
  ).pipe(
    Effect.flatMap(() => ComponentAuth),
    Effect.flatMap((auth) => auth.authenticate(request)),
    Effect.catchTag('ComponentAuthError', (error) =>
      Effect.fail(httpError(AUTH_STATUS[error.reason], error.message)),
    ),
    Effect.filterOrFail(
      () =>
        !hasBody ||
        request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() ===
          'application/json',
      () => httpError(415, 'Content-Type must be application/json'),
    ),
    Effect.filterOrFail(
      () => {
        if (!hasBody) {
          return true;
        }
        const header = request.headers.get('content-length');
        if (header === null) {
          return true;
        }
        const length = Number(header);
        return Number.isFinite(length) && length <= MAX_COMPONENT_BUNDLE_SIZE;
      },
      () => httpError(413, COMPONENT_BUNDLE_SIZE_MESSAGE),
    ),
    Effect.asVoid,
  );

/** Reads and decodes a size-limited JSON request body. */
const readBody = <A>(request: Request, schema: Schema.Schema<A>): Effect.Effect<A, HttpError> =>
  Effect.tryPromise({
    try: () => request.text(),
    catch: () => httpError(400, 'Unable to read component request body'),
  }).pipe(
    Effect.filterOrFail(
      (body) => body.length <= MAX_COMPONENT_BUNDLE_SIZE,
      () => httpError(413, COMPONENT_BUNDLE_SIZE_MESSAGE),
    ),
    Effect.flatMap((body) =>
      Schema.decodeUnknown(Schema.parseJson(schema))(body).pipe(
        Effect.catchAll(() => Effect.fail(httpError(400, 'Invalid request body'))),
      ),
    ),
  );

/** Validates a route component type, 404 on unknown values. */
const validateType = (type: string): Effect.Effect<ComponentType, HttpError> =>
  Schema.decodeUnknown(ComponentTypeSchema)(type).pipe(
    Effect.catchAll(() => Effect.fail(httpError(404, 'Invalid component type'))),
  );

/** Validates a route component id, 400 on non-UUID values. */
const validateId = (id: string): Effect.Effect<string, HttpError> =>
  Schema.decodeUnknown(ComponentIdSchema)(id).pipe(
    Effect.catchAll(() => Effect.fail(httpError(400, 'Invalid component id'))),
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
    guardRequest(request, hasBody).pipe(
      Effect.flatMap((): Effect.Effect<Body | undefined, HttpError> => {
        if (bodySchema === undefined) {
          return Effect.succeed(undefined);
        }
        return readBody(request, bodySchema);
      }),
      Effect.flatMap((body) =>
        Effect.flatMap(ComponentStore, (store) =>
          operation({ store, body }).pipe(
            Effect.catchTag('ComponentStoreError', (error) =>
              Effect.fail(httpError(STORE_STATUS[error.reason], error.message)),
            ),
          ),
        ),
      ),
    ),
  );

/**
 * Lists component records for a route type, projecting fields from the `?fields=` query parameter.
 *
 * @param request - Incoming request with an optional `fields` query parameter.
 * @param type - Component category from the route path.
 * @returns 200 with the projected records, 400 for an invalid projection, 404 when disabled or the type is invalid.
 */
export const listComponents = (
  request: Request,
  type: string,
): Effect.Effect<Response, never, ComponentStoreService | ComponentAuthService> => {
  const fieldsInput = new URL(request.url).searchParams.get('fields') ?? '';
  const projection: Effect.Effect<ReadonlyArray<ReadonlyArray<string>>, HttpError> = fieldsInput
    ? Effect.try({
        try: () =>
          Schema.decodeUnknownSync(FieldsSchema)(fieldsInput)
            .split(',')
            .map((path) => path.split('.').map((segment) => segment.trim())),
        catch: () => httpError(400, 'Invalid fields projection'),
      })
    : Effect.succeed([]);

  return toResponse(
    guardRequest(request, false).pipe(
      Effect.flatMap(() => validateType(type)),
      Effect.flatMap((validType) =>
        projection.pipe(
          Effect.flatMap((fields) =>
            Effect.flatMap(ComponentStore, (store) =>
              store.list(validType).pipe(
                Effect.map((records) =>
                  Response.json(records.map((record) => projectRecord(record, fields))),
                ),
              ),
            ),
          ),
        ),
      ),
      Effect.catchTag('ComponentStoreError', (error) =>
        Effect.fail(httpError(STORE_STATUS[error.reason], error.message)),
      ),
    ),
  );
};

/**
 * Retrieves a component record by its route type and id.
 *
 * @param request - Incoming request.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path.
 * @returns 200 with the record, 400 for an invalid id, 404 when disabled, the type is invalid, or the record is missing.
 */
export const getComponent = (
  request: Request,
  type: string,
  id: string,
): Effect.Effect<Response, never, ComponentStoreService | ComponentAuthService> =>
  handler(request, false, undefined, ({ store }) =>
    Effect.all([validateType(type), validateId(id)]).pipe(
      Effect.flatMap(([validType, validId]) =>
        store.get(validType, validId).pipe(Effect.map((record) => recordResponse(200, record))),
      ),
    ),
  );

/**
 * Creates a component record in the requested route type; the server assigns its id and dates.
 *
 * @param request - JSON request containing the client-editable component fields.
 * @param type - Component category from the route path.
 * @returns 201 with the created record; 400 for malformed input, 404 when disabled or the type is invalid.
 */
export const createComponent = (
  request: Request,
  type: string,
): Effect.Effect<Response, never, ComponentStoreService | ComponentAuthService> =>
  handler(request, true, CreateComponentRequestSchema, ({ store, body }) =>
    validateType(type).pipe(
      Effect.flatMap((validType) =>
        store
          .create(validType, body!)
          .pipe(Effect.map((record) => recordResponse(201, record))),
      ),
    ),
  );

/**
 * Updates an existing component record, preserving its creation date.
 * A body id, when present, must match the route id.
 *
 * @param request - JSON request containing the replacement client-editable component fields.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path.
 * @returns 200 with the updated record, 400 for malformed input or a mismatched body id, 404 when disabled, the type is invalid, or the record is missing.
 */
export const updateComponent = (
  request: Request,
  type: string,
  id: string,
): Effect.Effect<Response, never, ComponentStoreService | ComponentAuthService> =>
  handler(request, true, UpdateComponentRequestSchema, ({ store, body }) =>
    Effect.all([validateType(type), validateId(id)]).pipe(
      Effect.filterOrFail(
        ([, validId]) => body!.id === undefined || body!.id === validId,
        () => httpError(400, 'Invalid component id'),
      ),
      Effect.flatMap(([validType, validId]) =>
        store
          .update(validType, validId, body!)
          .pipe(Effect.map((record) => recordResponse(200, record))),
      ),
    ),
  );

/**
 * Deletes an existing component record.
 *
 * @param request - Incoming request.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path.
 * @returns 204 with no body, 400 for an invalid id, 404 when disabled, the type is invalid, or the record is missing.
 */
export const deleteComponent = (
  request: Request,
  type: string,
  id: string,
): Effect.Effect<Response, never, ComponentStoreService | ComponentAuthService> =>
  handler(request, false, undefined, ({ store }) =>
    Effect.all([validateType(type), validateId(id)]).pipe(
      Effect.flatMap(([validType, validId]) =>
        store
          .delete(validType, validId)
          .pipe(Effect.map(() => new Response(null, { status: 204 }))),
      ),
    ),
  );

/**
 * Publishes component source code and optional files as a repository bundle.
 *
 * @param request - JSON request containing bundle code and optional additional files.
 * @returns 200 with the published bundle reference, 400 for malformed input or a rejected bundle, 500 for a repository failure.
 */
export const publishComponentSource = (
  request: Request,
): Effect.Effect<Response, never, ComponentPublisherService | ComponentAuthService> =>
  toResponse(
    guardRequest(request, true).pipe(
      Effect.flatMap(() => readBody(request, PublishRequestSchema)),
      Effect.flatMap((body) =>
        publishComponent(publishBundle(body)).pipe(
          Effect.as(publishResponse()),
          Effect.catchTag('ComponentPublisherError', (error) =>
            Effect.fail(httpError(400, error.message)),
          ),
          Effect.catchTag('ComponentRepoError', (error) =>
            Effect.fail(httpError(500, error.message)),
          ),
          Effect.catchTag('FileSyncError', (error) => Effect.fail(httpError(500, error.message))),
        ),
      ),
    ),
  );
