import { Data } from 'effect';

/** Single source of truth for all BFF cookie name constants */
export const COOKIE_NAMES = {
  aid: '__aid',
  step: '__step',
  session: '__session',
  oauth: '__oauth',
} as const;

/** The set of cookie names used by the BFF for auth state — derived from COOKIE_NAMES */
export type CookieName = (typeof COOKIE_NAMES)[keyof typeof COOKIE_NAMES];

/** Network-level failure reaching ForgeRock AM */
export class AmUnreachable extends Data.TaggedError('AmUnreachable')<{
  readonly cause: unknown;
  readonly kind: 'connection' | 'timeout' | 'schema';
}> {}

/** AM returned a non-2xx response */
export class AmError extends Data.TaggedError('AmError')<{
  readonly status: number;
  readonly body: string;
}> {}

/** Failed to read the request body */
export class RequestBodyError extends Data.TaggedError('RequestBodyError')<{
  readonly cause: unknown;
}> {}

/**
 * BFF rejected the request due to client-side issues (4xx).
 * Examples: malformed redirect URL, missing PKCE verifier, bad auth header.
 */
export class BffClientError extends Data.TaggedError('BffClientError')<{
  readonly status: number;
  readonly message: string;
}> {}

/**
 * BFF encountered an internal failure (5xx).
 * Examples: cookie encryption failed, unexpected AM response format.
 */
export class BffInternalError extends Data.TaggedError('BffInternalError')<{
  readonly message: string;
}> {}

/** AES-256-GCM encryption failed during cookie sealing — invalid key or crypto error */
export class CookieEncryptionFailed extends Data.TaggedError('CookieEncryptionFailed')<{
  readonly cookie: CookieName;
  readonly cause: unknown;
}> {}

/** AES-256-GCM decryption failed — tampered cookie, rotated key, or corrupted data */
export class CookieDecryptionFailed extends Data.TaggedError('CookieDecryptionFailed')<{
  readonly cookie: CookieName;
  readonly cause: unknown;
}> {}

/** Cookie decrypted successfully but the data doesn't match the expected schema */
export class CookieSchemaError extends Data.TaggedError('CookieSchemaError')<{
  readonly cookie: CookieName;
  readonly cause: unknown;
}> {}

/** Required auth state cookie(s) missing from the request */
export class CookieMissing extends Data.TaggedError('CookieMissing')<{
  readonly cookie: CookieName;
}> {}

/** FormData → callback mapping failed (malformed input or mismatched IDToken names) */
export class StepMappingError extends Data.TaggedError('StepMappingError')<{
  readonly message: string;
}> {}

/** Too many requests from a single IP — rate limit exceeded */
export class RateLimitExceeded extends Data.TaggedError('RateLimitExceeded')<{
  readonly ip: string;
  readonly retryAfterSeconds: number;
}> {}

/** Cookie was present but decryption/schema validation failed — stale session after key rotation or tampering */
export class SessionCorrupted extends Data.TaggedError('SessionCorrupted')<{
  readonly cookie: CookieName;
  readonly cause: unknown;
}> {}

/** OIDC discovery has not yet completed — server is still starting up */
export class ServiceUnavailable extends Data.TaggedError('ServiceUnavailable')<{
  readonly message: string;
}> {}
