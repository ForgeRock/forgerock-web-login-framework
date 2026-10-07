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
  COMPONENT_BUNDLE_SIZE_MESSAGE,
  ComponentErrorResponseSchema,
  ComponentIdSchema,
  ComponentRecordSchema,
  ComponentTypeSchema,
  CreateComponentRequestSchema,
  FieldsSchema,
  MAX_COMPONENT_BUNDLE_SIZE,
  PublishRequestSchema,
  UpdateComponentRequestSchema,
} from './api.schemas';
import { Auth } from './auth/auth';
import { projectRecord } from './fields.utilities';
import { BUNDLE_ENTRY_PATH, Publish, publishBundle, publishResponse } from './publish/publish';
import { componentApiEnabled } from './settings';
import { type ApiErrorStatus, type ComponentLogger, HttpError, Log } from './shared';
import { type ComponentStoreError, Store } from './store/store';

import type { LogMessage } from '@forgerock/sdk-logger';

import type { AuthFn } from './auth/auth';
import type { ComponentPublishFn } from './publish/publish';
import type { AuthUser } from './shared';
import type { ComponentStoreApi } from './store/store';

/** Maps an authentication failure to the HTTP status a client should see. */
const AUTH_STATUS = {
  AuthUnauthenticatedError: 401,
  AuthForbiddenError: 403,
  AuthUnavailableError: 503,
} as const;

/** Maps a store failure to the HTTP status a client should see. */
const STORE_STATUS = {
  StoreNotFoundError: 404,
  StoreStorageError: 500,
} as const;

/** Maps a publish failure to the HTTP status a client should see. */
const PUBLISH_STATUS = {
  PublishInvalidError: 400,
  PublishStorageError: 500,
} as const;

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

/** Converts a store operation into its response value or client-facing HttpError. */
const fromStore = <Value, R>(
  effect: Effect.Effect<Value, ComponentStoreError, R>,
  onSuccess: (value: Value) => Response,
): Effect.Effect<Response, HttpError, R> =>
  Effect.map(
    Effect.catchTags(effect, {
      StoreNotFoundError: (error) =>
        Effect.fail(new HttpError({ status: STORE_STATUS[error._tag], message: error.message })),
      StoreStorageError: (error) =>
        Effect.fail(new HttpError({ status: STORE_STATUS[error._tag], message: error.message })),
    }),
    onSuccess,
  );

/** Logs a failed store mutation; a missing record changes nothing, so it is not an audit event. */
const auditStoreFailure =
  (log: ComponentLogger, audit: AuditFields) => (error: ComponentStoreError) =>
    error._tag === 'StoreStorageError'
      ? Effect.sync(() =>
          log.error(
            AUDIT_MESSAGE,
            { ...audit, outcome: 'failed', detail: error.message },
            ...causeDetails(error.cause),
          ),
        )
      : Effect.void;

/** Logs a successful or failed store mutation at its juncture. */
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
    Effect.tapError(auditStoreFailure(log, audit)),
  );

/**
 * Enforces API enablement (`COMPONENT_API_ENABLED=true`) and AM admin authentication. Disabled
 * deployments 404; authentication fails closed. Requires the Auth and Log services.
 */
const guardRequest = (
  request: Request,
): Effect.Effect<AuthUser, HttpError, AuthFn | ComponentLogger> =>
  Effect.flatMap(Effect.orDie(componentApiEnabled), (enabled) => {
    if (!enabled) {
      return Effect.fail(new HttpError({ status: 404, message: 'Not found' }));
    }
    return Effect.flatMap(Log, (log) =>
      Effect.flatMap(Auth, (authenticate) =>
        authenticate(request).pipe(
          Effect.tapError((error) =>
            Effect.sync(() => {
              // Unauthenticated callers have no uid to audit; the access log already holds the request.
              if (error._tag === 'AuthUnauthenticatedError') {
                return;
              }
              if (error._tag === 'ConfigError') {
                log.error(AUDIT_MESSAGE, {
                  action: 'access',
                  outcome: 'failed',
                  reason: error._tag,
                  detail: error.message,
                });
                return;
              }
              const fields = {
                action: 'access',
                outcome: error._tag === 'AuthUnavailableError' ? 'failed' : 'denied',
                reason: error._tag,
                detail: error.message,
                uid: error.uid,
              };
              if (error._tag === 'AuthUnavailableError') {
                log.error(AUDIT_MESSAGE, fields, ...causeDetails(error.cause));
              } else {
                log.warn(AUDIT_MESSAGE, fields);
              }
            }),
          ),
          Effect.catchTags({
            AuthUnauthenticatedError: (error) =>
              Effect.fail(
                new HttpError({ status: AUTH_STATUS[error._tag], message: error.message }),
              ),
            AuthForbiddenError: (error) =>
              Effect.fail(
                new HttpError({ status: AUTH_STATUS[error._tag], message: error.message }),
              ),
            AuthUnavailableError: (error) =>
              Effect.fail(
                new HttpError({ status: AUTH_STATUS[error._tag], message: error.message }),
              ),
            ConfigError: (error) =>
              Effect.fail(new HttpError({ status: 500, message: error.message })),
          }),
        ),
      ),
    );
  });

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
      if (Buffer.byteLength(bodyText, 'utf8') > MAX_COMPONENT_BUNDLE_SIZE) {
        return Effect.fail(new HttpError({ status: 413, message: COMPONENT_BUNDLE_SIZE_MESSAGE }));
      }
      return Effect.succeed(bodyText);
    }),
    Effect.flatMap((bodyText) =>
      Effect.mapError(
        Schema.decodeUnknown(Schema.parseJson(schema))(bodyText),
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
): Effect.Effect<Response, HttpError, AuthFn | ComponentLogger | R> =>
  guardRequest(request).pipe(
    Effect.flatMap((user) => Effect.map(readBody(request, bodySchema), (body) => ({ body, user }))),
    Effect.flatMap(({ body, user }) => operation({ body, user })),
  );

/** auditMutation with the logger taken from the Log service. */
const auditMutationEffect = <Value>(
  audit: AuditFields,
  effect: Effect.Effect<Value, ComponentStoreError>,
  describe: (value: Value) => AuditFields = () => ({}),
): Effect.Effect<Value, ComponentStoreError, ComponentLogger> =>
  Effect.flatMap(Log, (log) => auditMutation(log, audit, effect, describe));

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
): Effect.Effect<Response, never, AuthFn | ComponentLogger | ComponentStoreApi> =>
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
): Effect.Effect<Response, never, AuthFn | ComponentLogger | ComponentStoreApi> =>
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
): Effect.Effect<Response, never, AuthFn | ComponentLogger | ComponentStoreApi> =>
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
): Effect.Effect<Response, never, AuthFn | ComponentLogger | ComponentStoreApi> =>
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
): Effect.Effect<Response, never, AuthFn | ComponentLogger | ComponentStoreApi> =>
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
): Effect.Effect<Response, never, AuthFn | ComponentLogger | ComponentPublishFn> =>
  toResponse(
    handler(request, PublishRequestSchema, ({ body, user }) =>
      Effect.flatMap(Publish, (publish) =>
        Effect.flatMap(Log, (log) => {
          if ((body.files ?? []).some((file) => file.path === BUNDLE_ENTRY_PATH)) {
            const reserved = new HttpError({
              status: 400,
              message: `Bundle file path is reserved: ${BUNDLE_ENTRY_PATH}`,
            });
            return Effect.tapError(Effect.fail(reserved), () =>
              Effect.sync(() =>
                log.warn(AUDIT_MESSAGE, {
                  action: 'publish',
                  outcome: 'rejected',
                  uid: user.uid,
                  detail: reserved.message,
                }),
              ),
            );
          }
          const paths = [...(body.files ?? []).map((file) => file.path), BUNDLE_ENTRY_PATH];
          return publish(publishBundle(body)).pipe(
            Effect.catchTags({
              PublishInvalidError: (error) =>
                Effect.tapError(Effect.fail(error), () =>
                  Effect.sync(() =>
                    // Paths are left out of rejections because they are unsafe to echo.
                    log.warn(AUDIT_MESSAGE, {
                      action: 'publish',
                      outcome: 'rejected',
                      uid: user.uid,
                      detail: error.message,
                    }),
                  ),
                ),
              PublishStorageError: (error) =>
                Effect.tapError(Effect.fail(error), () =>
                  Effect.sync(() =>
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
                    ),
                  ),
                ),
            }),
            Effect.mapError(
              (error) =>
                new HttpError({ status: PUBLISH_STATUS[error._tag], message: error.message }),
            ),
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
