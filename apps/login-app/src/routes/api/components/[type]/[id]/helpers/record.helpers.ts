/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Data, Effect } from 'effect';

import {
  COMPONENT_BUNDLE_SIZE_MESSAGE,
  MAX_COMPONENT_BUNDLE_SIZE,
} from '$lib/server/component-api';
import {
  ComponentStore,
  type ComponentStoreError,
  type ComponentStoreService,
} from '$lib/server/component-store';

/** A client-facing HTTP failure raised while validating a component API request. */
export class HttpError extends Data.TaggedError('HttpError')<{
  status: 400 | 401 | 404 | 409 | 413 | 415 | 500;
  message: string;
}> {}

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
export const guardRequest = (
  request: Request,
  token: string | undefined,
  hasBody: boolean,
): Effect.Effect<void, HttpError> =>
  Effect.sync(() => requestHeaders(request)).pipe(
    Effect.filterOrFail(
      (headers) => token === undefined || headers.authorization === `Bearer ${token}`,
      () => new HttpError({ status: 401, message: 'Unauthorized' }),
    ),
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

/**
 * Maps a component store failure to its client-facing HTTP equivalent.
 *
 * @param error - Tagged component store failure to translate.
 * @returns The corresponding HTTP error.
 */
export const storeHttpError = (error: ComponentStoreError): HttpError =>
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
 * Catches HttpError failures in the effect and encodes them as HTTP Responses — the single
 * error-boundary per handler.
 *
 * @param effect - Response-producing effect that may fail with an HTTP error.
 * @returns The same response effect with its HTTP error channel handled.
 */
export const toResponse = <R>(
  effect: Effect.Effect<Response, HttpError, R>,
): Effect.Effect<Response, never, R> =>
  effect.pipe(
    Effect.catchTag('HttpError', (error) =>
      Effect.succeed(Response.json({ error: error.message }, { status: error.status })),
    ),
  );

/** Runs a record operation after enforcing request, type, and id policies. */
export const withRecord = (
  request: Request,
  type: string,
  id: string,
  token: string | undefined,
  operation: (
    store: ComponentStoreService,
    type: string,
    id: string,
  ) => Effect.Effect<Response, ComponentStoreError>,
): Effect.Effect<Response, never, ComponentStoreService> =>
  toResponse(
    Effect.gen(function* () {
      const hasBody = request.method === 'POST' || request.method === 'PUT';
      yield* guardRequest(request, token, hasBody);
      const validType = type;
      const validId = id;
      return yield* ComponentStore.pipe(
        Effect.flatMap((store) => operation(store, validType, validId)),
        Effect.catchTag('ComponentStoreError', (error) => Effect.fail(storeHttpError(error))),
      );
    }),
  );

/** Fails when an optional update body id differs from the validated route id. */
export const requireMatchingComponentId = (bodyId: string | undefined, routeId: string) =>
  bodyId !== undefined && bodyId !== routeId
    ? Effect.fail(new HttpError({ status: 400, message: 'Invalid component id' }))
    : Effect.void;
