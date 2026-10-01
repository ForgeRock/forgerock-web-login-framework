/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Context, Data, Effect, Layer } from 'effect';

import { AM_COOKIE_NAME } from '$core/constants';
import { env } from '$env/dynamic/private';
import { tokenIdSchema } from '$server/schemas';
import { getUserIdFromSession, getUserRolesForUser } from '$server/sessions';

import type { TokenId } from '$server/schemas';

/** An authenticated Component API caller, identified by their AM session uid. */
export interface AuthUser {
  readonly uid: string;
}

/**
 * Validates AM sessions on behalf of the Component API: extracts the session token from the
 * request (Bearer credential or AM cookie), verifies it with AM, requires an AM admin role, and
 * enforces an Origin check on mutating cookie-carried requests (CSRF).
 */
export interface ComponentAuthService {
  /**
   * Authenticates a Component API request.
   *
   * @param request - Incoming request presenting an AM session credential.
   * @returns An effect with the AM-verified caller.
   * @throws {ComponentAuthError} When the request is unauthenticated, forbidden, or AM is unavailable.
   */
  readonly authenticate: (request: Request) => Effect.Effect<AuthUser, ComponentAuthError>;
}

/** Failure raised when Component API authentication or authorization cannot complete. */
export class ComponentAuthError extends Data.TaggedError('ComponentAuthError')<{
  reason: 'Unauthenticated' | 'Forbidden' | 'Unavailable';
  message: string;
  cause?: unknown;
}> {}

/** AM roles that authorize Component API access, matching the admin-panel redirect convention. */
const ADMIN_ROLES = ['ui-global-admin', 'ui-realm-admin'];

/** AM session readers used by the authenticator; replaceable for tests. */
export interface AmSessionDependencies {
  getUserId: (tokenId: TokenId, realm?: string) => Promise<string | null>;
  getRoles: (tokenId: TokenId, uid: string) => Promise<string[]>;
}

/** Service tag for Component API AM-session admin authentication. */
const ComponentAuthTag = Context.GenericTag<ComponentAuthService>('@login-app/ComponentAuth');

/** Service tag and layers for Component API AM-session admin authentication. */
export const ComponentAuth = Object.assign(ComponentAuthTag, {
  /**
   * Creates a layer authenticating requests against AM sessions, with injectable session readers
   * so tests avoid AM without mocking network modules.
   *
   * @param dependencies - AM session readers; defaults to the shared `$server/sessions` calls.
   * @returns A layer providing {@link ComponentAuthService}.
   */
  layer: (
    dependencies: AmSessionDependencies = {
      getUserId: getUserIdFromSession,
      getRoles: getUserRolesForUser,
    },
  ): Layer.Layer<ComponentAuthService> =>
    Layer.succeed(ComponentAuthTag, {
      authenticate: (request: Request) =>
        Effect.flatMap(
          Effect.sync(() => extractSessionToken(request)),
          (tokenId) =>
            tokenId === null
              ? authFailure('Unauthenticated', 'An AM session token is required')
              : Effect.flatMap(
                  readAmSession(
                    dependencies.getUserId,
                    tokenId,
                    'Unable to validate the AM session',
                  ),
                  (uid) =>
                    uid === null
                      ? authFailure('Unauthenticated', 'The AM session is not valid')
                      : Effect.flatMap(
                          readAmSession(
                            (_) => dependencies.getRoles(tokenId, uid),
                            tokenId,
                            'Unable to read AM roles for the session',
                          ),
                          (roles) =>
                            roles.some((role) => ADMIN_ROLES.includes(role))
                              ? Effect.flatMap(csrfCheck(request), () => Effect.succeed({ uid }))
                              : authFailure('Forbidden', 'An AM admin role is required'),
                        ),
                ),
        ),
    }),
});

/**
 * Extracts an AM session token from a request. Browser admin sessions arrive as the AM session
 * cookie; CLI sessions present the same session token as an `Authorization: Bearer` credential.
 *
 * @param request - Incoming request whose credentials are read.
 * @returns The branded session token, or null when no usable credential is present.
 */
export const extractSessionToken = (request: Request): TokenId | null => {
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

const parseTokenValue = (value: string): TokenId | null => {
  const parsed = tokenIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

/**
 * Enforces an Origin check on mutating cookie-carried requests when `ORIGIN` is configured,
 * which blocks cross-site requests from riding an admin's AM session cookie (CSRF).
 *
 * @param request - Incoming request to check.
 * @returns An effect that fails with Forbidden when the origin is disallowed.
 */
const csrfCheck = (request: Request): Effect.Effect<void, ComponentAuthError> => {
  const mutating = request.method !== 'GET' && request.method !== 'HEAD';
  if (!mutating || request.headers.get('authorization') !== null) {
    return Effect.void;
  }
  const origin = request.headers.get('origin');
  const configuredOrigin = env.ORIGIN;
  return configuredOrigin !== undefined && origin !== null && origin !== configuredOrigin
    ? authFailure('Forbidden', 'Request origin is not allowed')
    : Effect.void;
};

const readAmSession = <A>(
  reader: (tokenId: TokenId, realm?: string) => Promise<A>,
  tokenId: TokenId,
  message: string,
): Effect.Effect<A, ComponentAuthError> =>
  Effect.tryPromise({
    try: () => reader(tokenId),
    catch: (cause) => new ComponentAuthError({ reason: 'Unavailable', message, cause }),
  });

const authFailure = (
  reason: 'Unauthenticated' | 'Forbidden' | 'Unavailable',
  message: string,
): Effect.Effect<never, ComponentAuthError> =>
  Effect.fail(new ComponentAuthError({ reason, message }));
