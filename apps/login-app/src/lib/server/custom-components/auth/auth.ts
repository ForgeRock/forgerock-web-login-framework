/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Cookies } from '@effect/platform';
import { Config, Context, Data, Effect, Layer, Option } from 'effect';

import { AM_COOKIE_NAME } from '$core/constants';
import { tokenIdSchema } from '$server/schemas';

import type { ConfigError } from 'effect/ConfigError';

import type { AuthUser } from '../shared';
import type { TokenId } from '$server/schemas';
import type { AmSession } from '$server/sessions';

/** An AM session token validated as a non-empty string; the brand comes from `$server/schemas`. */
export type { TokenId };

/** An authentication failure raised when no credential is present or AM rejects the session. */
export class AuthUnauthenticatedError extends Data.TaggedError('AuthUnauthenticatedError')<{
  readonly message: string;
}> {}

/** An authentication failure raised when the session lacks an admin role or fails the CSRF check. */
export class AuthForbiddenError extends Data.TaggedError('AuthForbiddenError')<{
  readonly message: string;
  /** Set when the AM session resolved to a user before the request was refused. */
  readonly uid?: string;
}> {}

/** An authentication failure raised when AM cannot be reached or CSRF cannot be evaluated. */
export class AuthUnavailableError extends Data.TaggedError('AuthUnavailableError')<{
  readonly message: string;
  readonly cause?: unknown;
  /** Set when the AM session resolved to a user before the request was refused. */
  readonly uid?: string;
}> {}

/** An authentication failure carried on the Effect error channel. */
export type ComponentAuthError =
  | AuthUnauthenticatedError
  | AuthForbiddenError
  | AuthUnavailableError
  | ConfigError;

/** AM roles that authorize Component API access, matching the admin-panel redirect convention. */
const ADMIN_ROLES = ['ui-global-admin', 'ui-realm-admin'];

/**
 * Reads an AM session on the authenticator's behalf; replaceable for tests. Returns the
 * session's user id, roles, and AM reachability so outages are distinguishable from
 * invalid sessions.
 */
export type AmSessionReader = (tokenId: TokenId, realm?: string) => Promise<AmSession>;

/** Authenticates a request, failing with a tagged auth error. */
export type AuthFn = (request: Request) => Effect.Effect<AuthUser, ComponentAuthError>;

/** The Component API authentication service. */
export interface AuthService {
  readonly authenticate: (request: Request) => Effect.Effect<AuthUser, ComponentAuthError>;
}

/** Service tag for Component API authentication; layers provide implementations. */
export const Auth = Context.GenericTag<AuthService>('Auth');

/**
 * Validates AM sessions on behalf of the Component API: extracts the session token from the
 * request (Bearer credential or AM cookie), verifies it with AM, requires an AM admin role, and
 * enforces an Origin check on mutating cookie-carried requests (CSRF).
 */
export const AuthLive = (readAmSession: AmSessionReader): Layer.Layer<AuthService> =>
  Layer.effect(
    Auth,
    Effect.gen(function* () {
      // Yielded once at build time so the caller never resolves it per request.
      const configuredOrigin = yield* authOrigin;
      return {
        authenticate: (request: Request): Effect.Effect<AuthUser, ComponentAuthError> =>
          Effect.gen(function* () {
            const tokenIdOption = extractSessionToken(request);
            if (Option.isNone(tokenIdOption)) {
              return yield* Effect.fail(
                new AuthUnauthenticatedError({ message: 'An AM session token is required' }),
              );
            }
            const session = yield* Effect.tryPromise({
              try: () => readAmSession(tokenIdOption.value),
              catch: (cause) =>
                new AuthUnavailableError({
                  message: 'Unable to validate the AM session',
                  cause,
                }),
            });
            if (session.unreachable) {
              return yield* Effect.fail(new AuthUnavailableError({ message: 'AM is unavailable' }));
            }
            if (session.userId === null) {
              return yield* Effect.fail(
                new AuthUnauthenticatedError({ message: 'The AM session is not valid' }),
              );
            }
            if (!session.roles.some((role) => ADMIN_ROLES.includes(role))) {
              return yield* Effect.fail(
                new AuthForbiddenError({
                  message: 'An AM admin role is required',
                  uid: session.userId,
                }),
              );
            }
            const csrfFailure = csrfCheck(request, configuredOrigin);
            if (csrfFailure !== undefined) {
              return yield* Effect.fail(
                csrfFailure._tag === 'AuthForbiddenError'
                  ? new AuthForbiddenError({ ...csrfFailure, uid: session.userId })
                  : csrfFailure,
              );
            }
            return { uid: session.userId };
          }),
      };
    }),
  );

/** The app's configured origin, resolved through Effect `Config`; empty means not configured. */
export const authOrigin: Effect.Effect<string, ConfigError> = Config.string('ORIGIN').pipe(
  Config.withDefault(''),
);

/**
 * Enforces an Origin check on mutating cookie-carried requests, which blocks cross-site
 * requests from riding an admin's AM session cookie (CSRF). Fails closed when `ORIGIN`
 * is not configured: an enabled API must reject mutations, not skip the check.
 * Returns the failure error, or undefined when the request may proceed.
 */
const csrfCheck = (request: Request, configuredOrigin: string): ComponentAuthError | undefined => {
  const mutating = request.method !== 'GET' && request.method !== 'HEAD';
  if (!mutating || request.headers.get('authorization') !== null) {
    return undefined;
  }
  if (configuredOrigin === '') {
    return new AuthUnavailableError({
      message: 'ORIGIN must be configured for cookie-carried mutations',
    });
  }
  const origin = request.headers.get('origin');
  return origin === configuredOrigin
    ? undefined
    : new AuthForbiddenError({ message: 'Request origin is not allowed' });
};

/**
 * Extracts an AM session token from a request. Browser admin sessions arrive as the AM session
 * cookie; CLI sessions present the same session token as an `Authorization: Bearer` credential.
 */
export const extractSessionToken = (request: Request): Option.Option<TokenId> => {
  const authorization = request.headers.get('authorization');
  if (authorization !== null && authorization.startsWith('Bearer ')) {
    return parseTokenValue(authorization.slice('Bearer '.length).trim());
  }
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader === null) {
    return Option.none();
  }
  const cookies = Cookies.parseHeader(cookieHeader);
  return cookies[AM_COOKIE_NAME] === undefined
    ? Option.none()
    : parseTokenValue(cookies[AM_COOKIE_NAME]);
};

const parseTokenValue = (value: string): Option.Option<TokenId> => {
  const parsed = tokenIdSchema.safeParse(value);
  return parsed.success ? Option.some(parsed.data) : Option.none();
};
