/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect, Schema } from 'effect';

import { Auth, HttpError, Log, Publish, Store } from './component.types';
import {
  COMPONENT_BUNDLE_SIZE_MESSAGE,
  ComponentErrorResponseSchema,
  ComponentIdSchema,
  ComponentRecordSchema,
  ComponentTypeSchema,
  CreateComponentRequestSchema,
  FieldsSchema,
  MAX_COMPONENT_BUNDLE_SIZE,
  projectRecord,
  PublishRequestSchema,
  UpdateComponentRequestSchema,
} from './fields.utils';
import { BUNDLE_ENTRY_PATH, publishBundle, publishResponse } from './publisher';

import type { LogMessage } from '@forgerock/sdk-logger';

import type {
  ApiErrorStatus,
  AuthUser,
  ComponentAuthFailureReason,
  ComponentLogger,
  ComponentPublishError,
  ComponentPublishFailureReason,
  ComponentStoreError,
  ComponentStoreFailureReason,
} from './component.types';

/** Whether this deployment serves the Component API. Disabled deployments 404 every route. */
export const isComponentApiEnabled = (): boolean => process.env.COMPONENT_API_ENABLED === 'true';

/** Maps an authentication failure reason to the HTTP status a client should see. */
const AUTH_STATUS: Record<ComponentAuthFailureReason, ApiErrorStatus> = {
  Unauthenticated: 401,
  Forbidden: 403,
  Unavailable: 500,
};

/** Maps a store failure reason to the HTTP status a client should see. */
const STORE_STATUS: Record<ComponentStoreFailureReason, ApiErrorStatus> = {
  NotFound: 404,
  Storage: 500,
};

/** Maps a publish failure reason to the HTTP status a client should see. */
const PUBLISH_STATUS: Record<ComponentPublishFailureReason, ApiErrorStatus> = {
  Invalid: 400,
  Storage: 500,
};

const AUDIT_MESSAGE = '[components] audit';

type AuditFields = { readonly [field: string]: string | ReadonlyArray<string> | undefined };

const causeDetails = (cause: unknown): LogMessage[] =>
  cause === undefined ? [] : [cause instanceof Error ? cause : String(cause)];

/** Encodes an error body as a JSON response. */
const errorResponse = (status: ApiErrorStatus, error: string): Response => {
  const encoded = Schema.encodeSync(ComponentErrorResponseSchema)({ status, body: { error } });
  return Response.json(encoded.body, { status: encoded.status });
};

/** Encodes HttpError failures as JSON error responses — the single error boundary per handler. */
const toResponse = <R>(
  effect: Effect.Effect<Response, HttpError, R>,
): Effect.Effect<Response, never, R> =>
  Effect.catchAll(effect, (error) => Effect.succeed(errorResponse(error.status, error.message)));

/** Encodes a validated component record as a JSON response that caches must not store. */
const recordResponse = (status: 200 | 201, record: typeof ComponentRecordSchema.Type): Response =>
  Response.json(Schema.encodeSync(ComponentRecordSchema)(record), {
    status,
    headers: { 'cache-control': 'no-store' },
  });

/** Converts a tagged store error into its client-facing HttpError. */
const fromStoreError = (error: ComponentStoreError): HttpError =>
  new HttpError({ status: STORE_STATUS[error.reason], message: error.message });

/** Converts a tagged publish error into its client-facing HttpError. */
const fromPublishError = (error: ComponentPublishError): HttpError =>
  new HttpError({ status: PUBLISH_STATUS[error.reason], message: error.message });

/** Converts a store operation into its response value or client-facing HttpError. */
const fromStore = <Value, R>(
  effect: Effect.Effect<Value, ComponentStoreError, R>,
  onSuccess: (value: Value) => Response,
): Effect.Effect<Response, HttpError, R> =>
  Effect.map(Effect.mapError(effect, fromStoreError), onSuccess);

/** Logs a successful or failed store mutation at its juncture; a missing record changes nothing. */
const auditMutation = <Value>(
  log: ComponentLogger,
  audit: AuditFields,
  effect: Effect.Effect<Value, ComponentStoreError>,
  describe: (value: Value) => AuditFields = () => ({}),
): Effect.Effect<Value, ComponentStoreError> =>
  effect.pipe(
    Effect.tap((value) =>
      Effect.sync(() =>
        log.info(AUDIT_MESSAGE, { ...audit, ...describe(value), outcome: 'succeeded' }),
      ),
    ),
    Effect.tapError((error) =>
      Effect.sync(() => {
        // A NotFound failure changes nothing, so it is not an audit event.
        if (error.reason === 'Storage') {
          log.error(
            AUDIT_MESSAGE,
            { ...audit, outcome: 'failed', detail: error.message },
            ...causeDetails(error.cause),
          );
        }
      }),
    ),
  );

/**
 * Enforces API enablement (`COMPONENT_API_ENABLED=true`) and AM admin authentication. Disabled
 * deployments 404; authentication fails closed. Requires the Auth and Log services.
 */
const guardRequest = (request: Request): Effect.Effect<AuthUser, HttpError, Auth | Log> => {
  if (!isComponentApiEnabled()) {
    return Effect.fail(new HttpError({ status: 404, message: 'Not found' }));
  }
  return Effect.flatMap(Log, (log) =>
    Effect.flatMap(Auth, (authenticate) =>
      authenticate(request).pipe(
        Effect.tapError((error) =>
          Effect.sync(() => {
            // Unauthenticated callers have no uid to audit; the access log already holds the request.
            if (error.reason === 'Unauthenticated') {
              return;
            }
            const fields = {
              action: 'access',
              outcome: error.reason === 'Unavailable' ? 'failed' : 'denied',
              reason: error.reason,
              detail: error.message,
              uid: error.uid,
            };
            if (error.reason === 'Unavailable') {
              log.error(AUDIT_MESSAGE, fields, ...causeDetails(error.cause));
            } else {
              log.warn(AUDIT_MESSAGE, fields);
            }
          }),
        ),
        Effect.mapError(
          (error) => new HttpError({ status: AUTH_STATUS[error.reason], message: error.message }),
        ),
      ),
    ),
  );
};

/** Validates the JSON content type and declared size, then reads and decodes a request body. */
const readBody = <A, I>(
  request: Request,
  schema: Schema.Schema<A, I>,
): Effect.Effect<A, HttpError> => {
  if (
    request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() !==
    'application/json'
  ) {
    return Effect.fail(
      new HttpError({ status: 415, message: 'Content-Type must be application/json' }),
    );
  }
  const header = request.headers.get('content-length');
  const declaredLength = header === null ? undefined : Number(header);
  if (
    declaredLength !== undefined &&
    (!Number.isFinite(declaredLength) || declaredLength > MAX_COMPONENT_BUNDLE_SIZE)
  ) {
    return Effect.fail(new HttpError({ status: 413, message: COMPONENT_BUNDLE_SIZE_MESSAGE }));
  }
  return Effect.tryPromise({
    try: () => request.text(),
    catch: () => new HttpError({ status: 400, message: 'Unable to read component request body' }),
  }).pipe(
    Effect.flatMap((bodyText) => {
      if (bodyText.length > MAX_COMPONENT_BUNDLE_SIZE) {
        return Effect.fail(new HttpError({ status: 413, message: COMPONENT_BUNDLE_SIZE_MESSAGE }));
      }
      return Effect.succeed(bodyText);
    }),
    Effect.flatMap((bodyText) =>
      Effect.try({
        try: () => JSON.parse(bodyText) as unknown,
        catch: () => new HttpError({ status: 400, message: 'Invalid request body' }),
      }),
    ),
    Effect.flatMap((parsed) =>
      Effect.mapError(
        Schema.decodeUnknown(schema)(parsed),
        () => new HttpError({ status: 400, message: 'Invalid request body' }),
      ),
    ),
  );
};

/** Validates a route component type, 404 on unknown values. */
const validateType = (type: string): Effect.Effect<typeof ComponentTypeSchema.Type, HttpError> =>
  Effect.mapError(
    Schema.decodeUnknown(ComponentTypeSchema)(type),
    () => new HttpError({ status: 404, message: 'Invalid component type' }),
  );

/** Validates a route component id, 400 on non-UUID values. */
const validateId = (id: string): Effect.Effect<string, HttpError> =>
  Effect.mapError(
    Schema.decodeUnknown(ComponentIdSchema)(id),
    () => new HttpError({ status: 400, message: 'Invalid component id' }),
  );

/** Parses the `?fields=` query parameter into projection paths, 400 on an invalid projection. */
const parseProjection = (
  request: Request,
): Effect.Effect<ReadonlyArray<ReadonlyArray<string>>, HttpError> => {
  const fieldsInput = new URL(request.url).searchParams.get('fields');
  if (fieldsInput === null || fieldsInput === '') {
    return Effect.succeed([]);
  }
  return Effect.map(
    Effect.mapError(
      Schema.decodeUnknown(FieldsSchema)(fieldsInput),
      () => new HttpError({ status: 400, message: 'Invalid fields projection' }),
    ),
    (fields) => fields.split(',').map((path) => path.split('.').map((segment) => segment.trim())),
  );
};

/**
 * Shared skeleton for every Component API handler: guard, body decode, and operation.
 * Operations must fail only with HttpError; store failures are mapped by their callers.
 * Handlers catch HttpError into a Response at the end; routes provide services and run them.
 */
const handler = <A, I, R>(
  request: Request,
  bodySchema: Schema.Schema<A, I>,
  operation: (context: { body: A; user: AuthUser }) => Effect.Effect<Response, HttpError, R>,
): Effect.Effect<Response, HttpError, Auth | Log | R> =>
  guardRequest(request).pipe(
    Effect.flatMap((user) => Effect.map(readBody(request, bodySchema), (body) => ({ body, user }))),
    Effect.flatMap(({ body, user }) => operation({ body, user })),
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
): Effect.Effect<Response, never, Auth | Log | Store> =>
  toResponse(
    guardRequest(request).pipe(
      Effect.flatMap(() => validateType(type)),
      Effect.flatMap((validType) =>
        Effect.map(parseProjection(request), (fields) => ({ fields, validType })),
      ),
      Effect.flatMap(({ fields, validType }) =>
        Effect.flatMap(Store, (store) =>
          fromStore(store.list(validType), (records) =>
            Response.json(
              records.map((record) => projectRecord(record, fields)),
              {
                headers: { 'cache-control': 'no-store' },
              },
            ),
          ),
        ),
      ),
    ),
  );

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
): Effect.Effect<Response, never, Auth | Log | Store> =>
  toResponse(
    guardRequest(request).pipe(
      Effect.flatMap(() =>
        Effect.flatMap(validateType(type), (validType) =>
          Effect.flatMap(validateId(id), (validId) =>
            Effect.flatMap(Store, (store) =>
              fromStore(store.get(validType, validId), (found) => recordResponse(200, found)),
            ),
          ),
        ),
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
): Effect.Effect<Response, never, Auth | Log | Store> =>
  toResponse(
    handler(request, CreateComponentRequestSchema, ({ body, user }) =>
      Effect.flatMap(validateType(type), (validType) =>
        Effect.flatMap(Store, (store) =>
          fromStore(
            auditMutationEffect(
              { action: 'create', uid: user.uid, type: validType },
              store.create(validType, body),
              (created) => ({ id: created.id, name: created.meta.name }),
            ),
            (created) => recordResponse(201, created),
          ),
        ),
      ),
    ),
  );

/** auditMutation with the logger taken from the Log service. */
const auditMutationEffect = <Value>(
  audit: AuditFields,
  effect: Effect.Effect<Value, ComponentStoreError>,
  describe: (value: Value) => AuditFields = () => ({}),
): Effect.Effect<Value, ComponentStoreError, Log> =>
  Effect.flatMap(Log, (log) => auditMutation(log, audit, effect, describe));

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
): Effect.Effect<Response, never, Auth | Log | Store> =>
  toResponse(
    handler(request, UpdateComponentRequestSchema, ({ body, user }) =>
      Effect.flatMap(validateType(type), (validType) =>
        Effect.flatMap(validateId(id), (validId) => {
          if (body.id !== undefined && body.id !== validId) {
            return Effect.fail(new HttpError({ status: 400, message: 'Invalid component id' }));
          }
          return Effect.flatMap(Store, (store) =>
            fromStore(
              auditMutationEffect(
                { action: 'update', uid: user.uid, type: validType, id: validId },
                store.update(validType, validId, body),
                (updated) => ({ name: updated.meta.name }),
              ),
              (updated) => recordResponse(200, updated),
            ),
          );
        }),
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
): Effect.Effect<Response, never, Auth | Log | Store> =>
  toResponse(
    guardRequest(request).pipe(
      Effect.flatMap(({ uid }) =>
        Effect.flatMap(validateType(type), (validType) =>
          Effect.flatMap(validateId(id), (validId) =>
            Effect.flatMap(Store, (store) =>
              fromStore(
                auditMutationEffect(
                  { action: 'delete', uid, type: validType, id: validId },
                  store.remove(validType, validId),
                ),
                () => new Response(null, { status: 204 }),
              ),
            ),
          ),
        ),
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
): Effect.Effect<Response, never, Auth | Log | Publish> =>
  toResponse(
    handler(request, PublishRequestSchema, ({ body, user }) =>
      Effect.all([Publish, Log]).pipe(
        Effect.flatMap(([publish, log]) => {
          const paths = [...(body.files ?? []).map((file) => file.path), BUNDLE_ENTRY_PATH];
          return publish(publishBundle(body)).pipe(
            Effect.tapError((error) =>
              Effect.sync(() => {
                // Paths are left out of rejections because they are unsafe to echo.
                if (error.reason === 'Invalid') {
                  log.warn(AUDIT_MESSAGE, {
                    action: 'publish',
                    outcome: 'rejected',
                    uid: user.uid,
                    detail: error.message,
                  });
                  return;
                }
                log.error(
                  AUDIT_MESSAGE,
                  {
                    action: 'publish',
                    outcome: 'failed',
                    uid: user.uid,
                    paths,
                    detail: error.message,
                  },
                  ...causeDetails(error.cause),
                );
              }),
            ),
            Effect.mapError(fromPublishError),
            Effect.map(() => {
              log.info(AUDIT_MESSAGE, {
                action: 'publish',
                outcome: 'succeeded',
                uid: user.uid,
                paths,
              });
              return publishResponse();
            }),
          );
        }),
      ),
    ),
  );
