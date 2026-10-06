/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect, Layer } from 'effect';

import { AM_COOKIE_NAME } from '$core/constants';
import { env } from '$env/dynamic/private';
import { tokenIdSchema } from '$server/schemas';
import { Auth, ComponentAuthError } from './component.types';

import type { AmSessionDependencies, AuthUser } from './component.types';

/** AM roles that authorize Component API access, matching the admin-panel redirect convention. */
const ADMIN_ROLES = ['ui-global-admin', 'ui-realm-admin'];

/** Fails with Unauthenticated when a credential check resolves to no user. */
const failUnauthenticated = (message: string) =>
  Effect.fail(new ComponentAuthError({ reason: 'Unauthenticated', message }));

/** Builds the Unavailable error thrown when an AM round trip fails, keeping cause and caller. */
const amUnavailable = (message: string, uid?: string) => (cause: unknown) =>
  new ComponentAuthError({ reason: 'Unavailable', message, cause, uid });

/**
 * Validates AM sessions on behalf of the Component API: extracts the session token from the
 * request (Bearer credential or AM cookie), verifies it with AM, requires an AM admin role, and
 * enforces an Origin check on mutating cookie-carried requests (CSRF).
 */
export const AuthLive = (dependencies: AmSessionDependencies): Layer.Layer<Auth> =>
  Layer.succeed(
    Auth,
    (request: Request): Effect.Effect<AuthUser, ComponentAuthError> =>
      Effect.sync(() => extractSessionToken(request)).pipe(
        Effect.flatMap((tokenId) =>
          tokenId === null
            ? failUnauthenticated('An AM session token is required')
            : Effect.succeed(tokenId),
        ),
        Effect.flatMap((tokenId) =>
          Effect.flatMap(
            Effect.tryPromise({
              try: () => dependencies.getUserId(tokenId),
              catch: amUnavailable('Unable to validate the AM session'),
            }),
            (uid) =>
              uid === null
                ? failUnauthenticated('The AM session is not valid')
                : Effect.succeed({ tokenId, uid }),
          ),
        ),
        Effect.bind('roles', ({ tokenId, uid }) =>
          Effect.tryPromise({
            try: () => dependencies.getRoles(tokenId, uid),
            catch: amUnavailable('Unable to read AM roles for the session', uid),
          }),
        ),
        Effect.flatMap(({ uid, roles }) =>
          roles.some((role) => ADMIN_ROLES.includes(role))
            ? Effect.succeed({ uid })
            : Effect.fail(
                new ComponentAuthError({
                  reason: 'Forbidden',
                  message: 'An AM admin role is required',
                  uid,
                }),
              ),
        ),
        Effect.bind('csrfFailure', () => Effect.promise(() => csrfCheck(request))),
        Effect.flatMap(({ uid, csrfFailure }) =>
          csrfFailure === undefined
            ? Effect.succeed({ uid })
            : Effect.fail(new ComponentAuthError({ ...csrfFailure, uid })),
        ),
      ),
  );

/**
 * Enforces an Origin check on mutating cookie-carried requests, which blocks cross-site
 * requests from riding an admin's AM session cookie (CSRF). Fails closed when `ORIGIN`
 * is not configured: an enabled API must reject mutations, not skip the check.
 * Returns the failure error, or undefined when the request may proceed.
 */
const csrfCheck = async (request: Request): Promise<ComponentAuthError | undefined> => {
  const mutating = request.method !== 'GET' && request.method !== 'HEAD';
  if (!mutating || request.headers.get('authorization') !== null) {
    return undefined;
  }
  const configuredOrigin = env.ORIGIN;
  if (configuredOrigin === undefined) {
    return new ComponentAuthError({
      reason: 'Unavailable',
      message: 'ORIGIN must be configured for cookie-carried mutations',
    });
  }
  const origin = request.headers.get('origin');
  return origin === configuredOrigin
    ? undefined
    : new ComponentAuthError({ reason: 'Forbidden', message: 'Request origin is not allowed' });
};

/**
 * Extracts an AM session token from a request. Browser admin sessions arrive as the AM session
 * cookie; CLI sessions present the same session token as an `Authorization: Bearer` credential.
 */
export const extractSessionToken = (
  request: Request,
): ReturnType<typeof tokenIdSchema.parse> | null => {
  const authorization = request.headers.get('authorization');
  if (authorization !== null && authorization.startsWith('Bearer ')) {
    return parseTokenValue(authorization.slice('Bearer '.length).trim());
  }
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader === null) {
    return null;
  }
  const pair = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AM_COOKIE_NAME}=`));
  return pair === undefined ? null : parseTokenValue(pair.slice(AM_COOKIE_NAME.length + 1));
};

const parseTokenValue = (value: string) => {
  const parsed = tokenIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};
