import { randomUUID } from 'node:crypto';

import { HttpServerResponse } from '@effect/platform';
import { Effect, Match, Schema, pipe } from 'effect';

import type { AmResponse } from '$server/services/am-proxy';

import {
  AmError,
  AmUnreachable,
  BffClientError,
  BffInternalError,
  CookieDecryptionFailed,
  CookieEncryptionFailed,
  CookieMissing,
  CookieSchemaError,
  RateLimitExceeded,
  RequestBodyError,
  ServiceUnavailable,
  StepMappingError,
} from '$server/errors';

export type BffError =
  | AmUnreachable
  | AmError
  | BffClientError
  | BffInternalError
  | RequestBodyError
  | CookieDecryptionFailed
  | CookieEncryptionFailed
  | CookieSchemaError
  | CookieMissing
  | RateLimitExceeded
  | StepMappingError
  | ServiceUnavailable;

// ─── HTTP Response Helpers ──────────────────────────────────────────────────

/** Build a JSON error response with consistent headers.
 * orDie is safe here — `{ error: string }` serialization cannot fail. */
const jsonErrorResponse = (
  status: number,
  error: string,
): Effect.Effect<HttpServerResponse.HttpServerResponse> =>
  HttpServerResponse.json({ error }, { status }).pipe(Effect.orDie);

/** Convert a proxied AM response into an HttpServerResponse */
export const amResponseToHttp = (amResponse: AmResponse): HttpServerResponse.HttpServerResponse =>
  HttpServerResponse.raw(amResponse.body, {
    status: amResponse.status,
    contentType: 'application/json',
  });

/** Map a typed BFF error to an appropriate HTTP response */
export const errorToResponse = (
  error: BffError,
): Effect.Effect<HttpServerResponse.HttpServerResponse> =>
  pipe(
    Match.value(error),
    Match.tags({
      AmUnreachable: () => jsonErrorResponse(502, 'AM service unavailable'),
      AmError: (err) =>
        parseAmErrorMessage(err.body).pipe(
          Effect.flatMap((message) => jsonErrorResponse(err.status, message)),
        ),
      BffClientError: (err) => jsonErrorResponse(err.status, err.message),
      BffInternalError: (err) => jsonErrorResponse(500, err.message),
      RequestBodyError: () => jsonErrorResponse(400, 'Invalid request body'),
      CookieDecryptionFailed: () => jsonErrorResponse(401, 'Session expired'),
      CookieEncryptionFailed: () => jsonErrorResponse(500, 'Internal server error'),
      CookieSchemaError: () => jsonErrorResponse(401, 'Session expired'),
      CookieMissing: () => jsonErrorResponse(401, 'Session expired'),
      RateLimitExceeded: (err) =>
        jsonErrorResponse(429, 'Too many requests').pipe(
          Effect.map((r) =>
            HttpServerResponse.setHeader(r, 'retry-after', String(err.retryAfterSeconds)),
          ),
        ),
      StepMappingError: () => jsonErrorResponse(400, 'Invalid form submission'),
      ServiceUnavailable: (err) => jsonErrorResponse(503, err.message),
    }),
    Match.exhaustive,
  );

// ─── AM Error Body Parsing ──────────────────────────────────────────────────

const AmErrorBody = Schema.Struct({
  message: Schema.optional(Schema.String),
  reason: Schema.optional(Schema.String),
}).annotations({ identifier: 'AmErrorBody' });

const DEFAULT_ERROR_MESSAGE = 'Authentication failed';

/**
 * Parse a user-facing error message from an AM error response body.
 * Uses `Schema.decodeUnknown(Schema.parseJson(...))` to validate external
 * AM data in a single Effect pipeline. Logs a warning for unparseable bodies.
 */
export const parseAmErrorMessage = (body: string): Effect.Effect<string> =>
  Schema.decodeUnknown(Schema.parseJson(AmErrorBody))(body).pipe(
    Effect.map((p) => p.message ?? p.reason ?? DEFAULT_ERROR_MESSAGE),
    Effect.catchTag('ParseError', () =>
      body.length > 0
        ? Effect.logWarning('Failed to parse AM error body').pipe(
            Effect.annotateLogs({ bodyPreview: body.slice(0, 200) }),
            Effect.as(DEFAULT_ERROR_MESSAGE),
          )
        : Effect.succeed(DEFAULT_ERROR_MESSAGE),
    ),
  );

/** Map a BffError to a user-friendly error message for form action responses */
export const errorToMessage = (error: BffError): Effect.Effect<string> =>
  pipe(
    Match.value(error),
    Match.tags({
      AmUnreachable: () => Effect.succeed('Authentication service unavailable'),
      AmError: (err) => parseAmErrorMessage(err.body),
      BffClientError: (err) => Effect.succeed(err.message),
      BffInternalError: (err) => Effect.succeed(err.message),
      RequestBodyError: () => Effect.succeed('Invalid request'),
      CookieDecryptionFailed: () => Effect.succeed('Session expired, please try again'),
      CookieEncryptionFailed: () => Effect.succeed('An internal error occurred, please try again'),
      CookieSchemaError: () => Effect.succeed('Session expired, please try again'),
      CookieMissing: () => Effect.succeed('Session expired, please try again'),
      RateLimitExceeded: () => Effect.succeed('Too many requests, please try again later'),
      StepMappingError: (err) => Effect.succeed(err.message),
      ServiceUnavailable: (err) => Effect.succeed(err.message),
    }),
    Match.exhaustive,
  );

// ─── Error Logging ──────────────────────────────────────────────────────────

/** Build structured log annotations from a BffError */
const errorAnnotations = (error: BffError): Record<string, string> => ({
  errorTag: error._tag,
  ...('cause' in error ? { cause: String(error.cause) } : {}),
  ...('status' in error ? { status: String(error.status) } : {}),
  ...('message' in error ? { errorMessage: error.message } : {}),
  ...('body' in error ? { body: String(error.body).slice(0, 200) } : {}),
});

/** Select log level based on error type:
 * - Error: AM 5xx (server-side failures that warrant on-call alerts)
 * - Info: AM 4xx, rate limiting, startup transient conditions
 * - Warning: everything else (BFF internal issues, cookie failures)
 */
const errorLogLevel = (error: BffError) => {
  if (error._tag === 'AmError' && error.status >= 500) return Effect.logError;
  if (
    (error._tag === 'AmError' && (error.status === 400 || error.status === 401)) ||
    error._tag === 'ServiceUnavailable' ||
    error._tag === 'RateLimitExceeded'
  )
    return Effect.logInfo;
  return Effect.logWarning;
};

/**
 * Log a typed BFF error without removing it from the error channel.
 * Use with `Effect.tapError` to observe errors while letting them propagate.
 */
export const logBffError =
  (label: string) =>
  (error: BffError): Effect.Effect<void> =>
    errorLogLevel(error)(`BFF ${label} error`).pipe(Effect.annotateLogs(errorAnnotations(error)));

/**
 * Log an unhandled defect and produce a fallback value.
 * Defects (unexpected throws) are always fatal-level and must be caught
 * at the boundary to prevent `runPromise` from rejecting.
 *
 * Generates a short correlation ref included in both the log and the fallback
 * so operators can match user-reported errors to specific log entries.
 */
export const catchDefect =
  <A>(label: string, fallbackFn: (ref: string) => A) =>
  (defect: unknown): Effect.Effect<A> => {
    const ref = randomUUID().slice(0, 8);
    const cause = defect instanceof Error ? defect : new Error(String(defect));
    return Effect.logError(`Unhandled defect in ${label}`).pipe(
      Effect.annotateLogs({ defect: cause.stack ?? String(cause), errorRef: ref }),
      Effect.as(fallbackFn(ref)),
    );
  };
