/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect, Schema } from 'effect';

import { HttpError } from './component.types';
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
  ComponentApiDependencies,
  ComponentAuthError,
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

/** Encodes a validated component record as a JSON response. */
const recordResponse = (status: 200 | 201, record: typeof ComponentRecordSchema.Type): Response =>
  Response.json(Schema.encodeSync(ComponentRecordSchema)(record), { status });

/** Converts a tagged store error into its client-facing HttpError. */
const fromStoreError = (error: ComponentStoreError): HttpError =>
  new HttpError({ status: STORE_STATUS[error.reason], message: error.message });

/** Converts a tagged publish error into its client-facing HttpError. */
const fromPublishError = (error: ComponentPublishError): HttpError =>
  new HttpError({ status: PUBLISH_STATUS[error.reason], message: error.message });

/** Runs an API effect to completion, encoding HttpError failures as JSON error responses. */
const runApi = (effect: Effect.Effect<Response, HttpError>): Promise<Response> =>
  Effect.runPromise(
    Effect.catchAll(effect, (error) => Effect.succeed(errorResponse(error.status, error.message))),
  );

/** Converts a store operation into its response value or client-facing HttpError. */
const fromStore = <Value>(
  effect: Effect.Effect<Value, ComponentStoreError>,
  onSuccess: (value: Value) => Response,
): Effect.Effect<Response, HttpError> =>
  Effect.map(Effect.mapError(effect, fromStoreError), onSuccess);

/** Logs how a store mutation ended; a missing record changes nothing, so it is not audited. */
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

/** Logs a request refused for a known caller, or an authentication failure on our side. */
const auditDenied = (log: ComponentLogger, request: Request, error: ComponentAuthError): void => {
  // No valid session means no identity to audit; the HTTP layer already records the request.
  if (error.reason === 'Unauthenticated') {
    return;
  }
  const audit: AuditFields = {
    action: 'access',
    outcome: error.reason === 'Unavailable' ? 'failed' : 'denied',
    reason: error.reason,
    detail: error.message,
    method: request.method,
    path: new URL(request.url).pathname,
    uid: error.uid,
  };
  if (error.reason === 'Unavailable') {
    log.error(AUDIT_MESSAGE, audit, ...causeDetails(error.cause));
    return;
  }
  log.warn(AUDIT_MESSAGE, audit);
};

/** Logs a rejected or failed publish; paths are left out of rejections because they are unsafe. */
const auditPublishFailure = (
  log: ComponentLogger,
  uid: string,
  paths: ReadonlyArray<string>,
  error: ComponentPublishError,
): void => {
  if (error.reason === 'Invalid') {
    log.warn(AUDIT_MESSAGE, { action: 'publish', outcome: 'rejected', uid, detail: error.message });
    return;
  }
  log.error(
    AUDIT_MESSAGE,
    { action: 'publish', outcome: 'failed', uid, paths, detail: error.message },
    ...causeDetails(error.cause),
  );
};

/**
 * Enforces API enablement (`COMPONENT_API_ENABLED=true`), AM admin authentication, JSON content
 * type, and the declared body size limit. Disabled deployments 404; authentication fails closed.
 * Returns the authenticated caller when the request may proceed.
 */
const guardRequest = (
  request: Request,
  hasBody: boolean,
  dependencies: Pick<ComponentApiDependencies, 'authenticate' | 'log'>,
): Effect.Effect<AuthUser, HttpError> => {
  const fail = (status: ApiErrorStatus, message: string) =>
    Effect.fail(new HttpError({ status, message }));

  if (!isComponentApiEnabled()) {
    return fail(404, 'Not found');
  }
  return dependencies.authenticate(request).pipe(
    Effect.tapError((error) => Effect.sync(() => auditDenied(dependencies.log, request, error))),
    Effect.mapError(
      (error) => new HttpError({ status: AUTH_STATUS[error.reason], message: error.message }),
    ),
    Effect.flatMap((user) => {
      if (
        hasBody &&
        request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() !==
          'application/json'
      ) {
        return fail(415, 'Content-Type must be application/json');
      }
      if (!hasBody) {
        return Effect.succeed(user);
      }
      const header = request.headers.get('content-length');
      if (header === null) {
        return Effect.succeed(user);
      }
      const length = Number(header);
      if (!Number.isFinite(length) || length > MAX_COMPONENT_BUNDLE_SIZE) {
        return fail(413, COMPONENT_BUNDLE_SIZE_MESSAGE);
      }
      return Effect.succeed(user);
    }),
  );
};

/** Reads and decodes a size-limited JSON request body. */
const readBody = <A, I>(
  request: Request,
  schema: Schema.Schema<A, I>,
): Effect.Effect<A, HttpError> =>
  Effect.tryPromise({
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
    Effect.flatMap((parsed) => {
      const result = Schema.decodeUnknownEither(schema)(parsed);
      return result._tag === 'Left'
        ? Effect.fail(new HttpError({ status: 400, message: 'Invalid request body' }))
        : Effect.succeed(result.right);
    }),
  );

/** Validates a route component type, 404 on unknown values. */
const validateType = (type: string): Effect.Effect<typeof ComponentTypeSchema.Type, HttpError> => {
  const result = Schema.decodeUnknownEither(ComponentTypeSchema)(type);
  return result._tag === 'Right'
    ? Effect.succeed(result.right)
    : Effect.fail(new HttpError({ status: 404, message: 'Invalid component type' }));
};

/** Validates a route component id, 400 on non-UUID values. */
const validateId = (id: string): Effect.Effect<string, HttpError> => {
  const result = Schema.decodeUnknownEither(ComponentIdSchema)(id);
  return result._tag === 'Right'
    ? Effect.succeed(result.right)
    : Effect.fail(new HttpError({ status: 400, message: 'Invalid component id' }));
};

/** Parses the `?fields=` query parameter into projection paths, 400 on an invalid projection. */
const parseProjection = (
  request: Request,
): Effect.Effect<ReadonlyArray<ReadonlyArray<string>>, HttpError> => {
  const fieldsInput = new URL(request.url).searchParams.get('fields');
  if (fieldsInput === null || fieldsInput === '') {
    return Effect.succeed([]);
  }
  const result = Schema.decodeUnknownEither(FieldsSchema)(fieldsInput);
  if (result._tag === 'Left') {
    return Effect.fail(new HttpError({ status: 400, message: 'Invalid fields projection' }));
  }
  return Effect.succeed(
    result.right.split(',').map((path) => path.split('.').map((segment) => segment.trim())),
  );
};

/**
 * Shared skeleton for every Component API handler: guard, body decode, and operation.
 * Operations must fail only with HttpError; store failures are mapped by their callers.
 */
const handler = <A, I>(
  request: Request,
  bodySchema: Schema.Schema<A, I>,
  operation: (context: {
    store: ComponentApiDependencies['store'];
    body: A;
    user: AuthUser;
  }) => Effect.Effect<Response, HttpError>,
  dependencies: ComponentApiDependencies,
): Promise<Response> =>
  runApi(
    guardRequest(request, true, dependencies).pipe(
      Effect.flatMap((user) =>
        Effect.map(readBody(request, bodySchema), (body) => ({ body, user })),
      ),
      Effect.flatMap(({ body, user }) => operation({ store: dependencies.store, body, user })),
    ),
  );

/** Handler skeleton for requests without a body (GET, DELETE). */
const bodylessHandler = (
  request: Request,
  operation: (context: {
    store: ComponentApiDependencies['store'];
    user: AuthUser;
  }) => Effect.Effect<Response, HttpError>,
  dependencies: ComponentApiDependencies,
): Promise<Response> =>
  runApi(
    guardRequest(request, false, dependencies).pipe(
      Effect.flatMap((user) => operation({ store: dependencies.store, user })),
    ),
  );

/**
 * Lists component records for a route type, projecting fields from the `?fields=` query parameter.
 *
 * @param request - Incoming request with an optional `fields` query parameter.
 * @param type - Component category from the route path.
 * @param dependencies - Handler dependencies (authenticate, store, publish, log).
 * @returns 200 with the projected records, 400 for an invalid projection, 404 when disabled or the type is invalid.
 */
export const listComponents = (
  request: Request,
  type: string,
  dependencies: ComponentApiDependencies,
): Promise<Response> =>
  runApi(
    guardRequest(request, false, dependencies).pipe(
      Effect.flatMap(() => validateType(type)),
      Effect.flatMap((validType) =>
        Effect.map(parseProjection(request), (fields) => ({ fields, validType })),
      ),
      Effect.flatMap(({ fields, validType }) =>
        fromStore(dependencies.store.list(validType), (records) =>
          Response.json(records.map((record) => projectRecord(record, fields))),
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
 * @param dependencies - Handler dependencies (authenticate, store, publish, log).
 * @returns 200 with the record, 400 for an invalid id, 404 when disabled, the type is invalid, or the record is missing.
 */
export const getComponent = (
  request: Request,
  type: string,
  id: string,
  dependencies: ComponentApiDependencies,
): Promise<Response> =>
  bodylessHandler(
    request,
    ({ store }) =>
      Effect.flatMap(validateType(type), (validType) =>
        Effect.flatMap(validateId(id), (validId) =>
          fromStore(store.get(validType, validId), (found) => recordResponse(200, found)),
        ),
      ),
    dependencies,
  );

/**
 * Creates a component record in the requested route type; the server assigns its id and dates.
 *
 * @param request - JSON request containing the client-editable component fields.
 * @param type - Component category from the route path.
 * @param dependencies - Handler dependencies (authenticate, store, publish, log).
 * @returns 201 with the created record; 400 for malformed input, 404 when disabled or the type is invalid.
 */
export const createComponent = (
  request: Request,
  type: string,
  dependencies: ComponentApiDependencies,
): Promise<Response> =>
  handler(
    request,
    CreateComponentRequestSchema,
    ({ store, body, user }) =>
      Effect.flatMap(validateType(type), (validType) =>
        fromStore(
          auditMutation(
            dependencies.log,
            { action: 'create', uid: user.uid, type: validType },
            store.create(validType, body),
            (created) => ({ id: created.id, name: created.meta.name }),
          ),
          (created) => recordResponse(201, created),
        ),
      ),
    dependencies,
  );

/**
 * Updates an existing component record, preserving its creation date.
 * A body id, when present, must match the route id.
 *
 * @param request - JSON request containing the replacement client-editable component fields.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path.
 * @param dependencies - Handler dependencies (authenticate, store, publish, log).
 * @returns 200 with the updated record, 400 for malformed input or a mismatched body id, 404 when disabled, the type is invalid, or the record is missing.
 */
export const updateComponent = (
  request: Request,
  type: string,
  id: string,
  dependencies: ComponentApiDependencies,
): Promise<Response> =>
  handler(
    request,
    UpdateComponentRequestSchema,
    ({ store, body, user }) =>
      Effect.flatMap(validateType(type), (validType) =>
        Effect.flatMap(validateId(id), (validId) => {
          if (body.id !== undefined && body.id !== validId) {
            return Effect.fail(new HttpError({ status: 400, message: 'Invalid component id' }));
          }
          return fromStore(
            auditMutation(
              dependencies.log,
              { action: 'update', uid: user.uid, type: validType, id: validId },
              store.update(validType, validId, body),
              (updated) => ({ name: updated.meta.name }),
            ),
            (updated) => recordResponse(200, updated),
          );
        }),
      ),
    dependencies,
  );

/**
 * Deletes an existing component record.
 *
 * @param request - Incoming request.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path.
 * @param dependencies - Handler dependencies (authenticate, store, publish, log).
 * @returns 204 with no body, 400 for an invalid id, 404 when disabled, the type is invalid, or the record is missing.
 */
export const deleteComponent = (
  request: Request,
  type: string,
  id: string,
  dependencies: ComponentApiDependencies,
): Promise<Response> =>
  bodylessHandler(
    request,
    ({ store, user }) =>
      Effect.flatMap(validateType(type), (validType) =>
        Effect.flatMap(validateId(id), (validId) =>
          fromStore(
            auditMutation(
              dependencies.log,
              { action: 'delete', uid: user.uid, type: validType, id: validId },
              store.remove(validType, validId),
            ),
            () => new Response(null, { status: 204 }),
          ),
        ),
      ),
    dependencies,
  );

/**
 * Publishes component source code and optional files as a repository bundle.
 *
 * @param request - JSON request containing bundle code and optional additional files.
 * @param dependencies - Handler dependencies (authenticate, store, publish, log).
 * @returns 200 with the published bundle reference, 400 for malformed input or a rejected bundle, 500 for a repository failure.
 */
export const publishComponentSource = (
  request: Request,
  dependencies: ComponentApiDependencies,
): Promise<Response> =>
  runApi(
    guardRequest(request, true, dependencies).pipe(
      Effect.flatMap((user) =>
        Effect.map(readBody(request, PublishRequestSchema), (body) => ({ body, user })),
      ),
      Effect.flatMap(({ body, user }) => {
        const paths = [...(body.files ?? []).map((file) => file.path), BUNDLE_ENTRY_PATH];
        return dependencies.publish(publishBundle(body)).pipe(
          Effect.tapError((error) =>
            Effect.sync(() => auditPublishFailure(dependencies.log, user.uid, paths, error)),
          ),
          Effect.mapError(fromPublishError),
          Effect.map(() => {
            dependencies.log.info(AUDIT_MESSAGE, {
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
  );
