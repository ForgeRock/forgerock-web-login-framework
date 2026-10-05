/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { AM_COOKIE_NAME } from '$core/constants';
import { env } from '$env/dynamic/private';
import { tokenIdSchema } from '$server/schemas';

import type {
  AmSessionDependencies,
  ComponentAuthError,
  ComponentAuthFailureReason,
  ComponentAuthResult,
} from './component.types';
import type { TokenId } from '$server/schemas';

/** AM roles that authorize Component API access, matching the admin-panel redirect convention. */
const ADMIN_ROLES = ['ui-global-admin', 'ui-realm-admin'];

/** Builds an authentication failure value. */
const authFailure = (
  reason: ComponentAuthFailureReason,
  message: string,
  cause?: unknown,
): ComponentAuthResult => ({ success: false, error: { reason, message, cause } });

/**
 * Validates AM sessions on behalf of the Component API: extracts the session token from the
 * request (Bearer credential or AM cookie), verifies it with AM, requires an AM admin role, and
 * enforces an Origin check on mutating cookie-carried requests (CSRF).
 *
 * @param dependencies - AM session readers; tests substitute their own.
 * @returns An authenticator function returning the authenticated user or a failure value.
 */
export const createComponentAuth =
  (dependencies: AmSessionDependencies) =>
  async (request: Request): Promise<ComponentAuthResult> => {
    const tokenId = extractSessionToken(request);
    if (tokenId === null) {
      return authFailure('Unauthenticated', 'An AM session token is required');
    }

    let uid: string | null;
    try {
      uid = await dependencies.getUserId(tokenId);
    } catch (cause) {
      return authFailure('Unavailable', 'Unable to validate the AM session', cause);
    }
    if (uid === null) {
      return authFailure('Unauthenticated', 'The AM session is not valid');
    }

    let roles: string[];
    try {
      roles = await dependencies.getRoles(tokenId, uid);
    } catch (cause) {
      return authFailure('Unavailable', 'Unable to read AM roles for the session', cause);
    }
    if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
      return authFailure('Forbidden', 'An AM admin role is required');
    }

    const csrfFailure = await csrfCheck(request);
    return csrfFailure !== undefined
      ? { success: false, error: csrfFailure }
      : { success: true, value: { uid } };
  };

/**
 * Enforces an Origin check on mutating cookie-carried requests, which blocks cross-site
 * requests from riding an admin's AM session cookie (CSRF). Fails closed when `ORIGIN`
 * is not configured: an enabled API must reject mutations, not skip the check.
 * Returns the failure value, or undefined when the request may proceed.
 */
const csrfCheck = async (request: Request): Promise<ComponentAuthError | undefined> => {
  const mutating = request.method !== 'GET' && request.method !== 'HEAD';
  if (!mutating || request.headers.get('authorization') !== null) {
    return undefined;
  }
  const configuredOrigin = env.ORIGIN;
  if (configuredOrigin === undefined) {
    return {
      reason: 'Unavailable',
      message: 'ORIGIN must be configured for cookie-carried mutations',
    };
  }
  const origin = request.headers.get('origin');
  return origin === configuredOrigin
    ? undefined
    : { reason: 'Forbidden', message: 'Request origin is not allowed' };
};

/**
 * Extracts an AM session token from a request. Browser admin sessions arrive as the AM session
 * cookie; CLI sessions present the same session token as an `Authorization: Bearer` credential.
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
