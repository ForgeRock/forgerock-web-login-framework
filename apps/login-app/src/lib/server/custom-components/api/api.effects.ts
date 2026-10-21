/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect, Match, Option, Schema } from 'effect';

import { Auth } from '../auth/auth';
import { type ComponentLogger, Log } from '../log';
import { componentApiEnabled } from '../settings';
import { COMPONENT_BUNDLE_SIZE_MESSAGE, HttpError, MAX_COMPONENT_BUNDLE_SIZE } from './api.schemas';
import { type AuditFields, causeDetails } from './api.utilities';

import type { AuthService, AuthUser, ComponentAuthError } from '../auth/auth';
import type { ComponentStoreError } from '../store/store';

/**
 * Enforces API enablement (`COMPONENT_API_ENABLED=true`) and AM admin authentication. Disabled
 * deployments 404; authentication fails closed; an unresolvable enablement value is 503, not a
 * silent disable, so misconfiguration is visible. Requires the Auth and Log services.
 */
export const guardRequest = (
  request: Request,
): Effect.Effect<AuthUser, HttpError, AuthService | ComponentLogger> =>
  Effect.gen(function* () {
    const log = yield* Log;
    const enabled = yield* componentApiEnabled.pipe(
      Effect.catchTag('ConfigError', (cause) =>
        Effect.fail(
          new HttpError({ status: 503, message: 'Component API is misconfigured', cause }),
        ),
      ),
    );
    if (!enabled) {
      return yield* Effect.fail(new HttpError({ status: 404, message: 'Not found' }));
    }
    const auth = yield* Auth;
    return yield* auth.authenticate(request).pipe(
      Effect.tapError(auditAuthFailure(log)),
      Effect.catchTags({
        AuthUnauthenticatedError: (error) =>
          Effect.fail(new HttpError({ status: 401, message: error.message })),
        AuthForbiddenError: (error) =>
          Effect.fail(new HttpError({ status: 403, message: error.message })),
        AuthUnavailableError: (error) =>
          Effect.fail(new HttpError({ status: 503, message: error.message })),
      }),
    );
  });

/**
 * Audits a refused or failed authentication at the guard, with the outcome and caller.
 * Unauthenticated callers have no uid to audit; the access log already holds the request.
 */
export const auditAuthFailure = (log: ComponentLogger) => (error: ComponentAuthError) =>
  Match.value(error).pipe(
    Match.tag('AuthUnauthenticatedError', () => Effect.void),
    Match.tag('AuthUnavailableError', (error) =>
      Effect.sync(() =>
        log.error(
          '[components] audit',
          {
            action: 'access',
            outcome: 'failed',
            reason: error._tag,
            detail: error.message,
            uid: error.uid,
          },
          ...causeDetails(error.cause),
        ),
      ),
    ),
    Match.tag('AuthForbiddenError', (error) =>
      Effect.sync(() =>
        log.warn('[components] audit', {
          action: 'access',
          outcome: 'denied',
          reason: error._tag,
          detail: error.message,
          uid: error.uid,
        }),
      ),
    ),
    Match.exhaustive,
  );

/** Logs a successful or failed store mutation at its juncture; a missing record changes nothing, so it is not an audit event. */
export const auditMutation = <Value>(
  log: ComponentLogger,
  audit: AuditFields,
  effect: Effect.Effect<Value, ComponentStoreError>,
  describe: (value: Value) => AuditFields = () => ({}),
): Effect.Effect<Value, ComponentStoreError> =>
  effect.pipe(
    Effect.tap((value) =>
      Effect.sync(() =>
        log.info('[components] audit', { ...audit, ...describe(value), outcome: 'succeeded' }),
      ),
    ),
    Effect.tapError((error) =>
      Match.value(error).pipe(
        Match.tag('StoreStorageError', (storageError) =>
          Effect.sync(() =>
            log.error(
              '[components] audit',
              { ...audit, outcome: 'failed', detail: storageError.message },
              ...causeDetails(storageError.cause),
            ),
          ),
        ),
        Match.option,
        Option.getOrUndefined,
        (matched) => (matched === undefined ? Effect.void : matched),
      ),
    ),
  );

/** Validates the JSON content type and declared size, then reads and decodes a request body. */
export const readBody = <A, I>(
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
  if (declaredLength !== undefined && !Number.isFinite(declaredLength)) {
    return Effect.fail(new HttpError({ status: 400, message: 'Invalid Content-Length header' }));
  }
  if (declaredLength !== undefined && declaredLength > MAX_COMPONENT_BUNDLE_SIZE) {
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
