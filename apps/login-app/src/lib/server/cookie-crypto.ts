import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import {
  brotliCompress as brotliCompressCb,
  brotliDecompress as brotliDecompressCb,
  constants,
} from 'node:zlib';

import { Cookies as PlatformCookies } from '@effect/platform';
import type { Cookies } from '@sveltejs/kit';
import { Duration, Effect, Either, Encoding, Redacted, Schema, pipe } from 'effect';

import { AmCallbackSchema } from '$server/am-response-schemas';
import {
  COOKIE_NAMES,
  CookieDecryptionFailed,
  CookieEncryptionFailed,
  CookieMissing,
  CookieSchemaError,
} from '$server/errors';
import { AppConfigService, type AppConfig } from '$server/services/app-config';

// ─── Constants ───────────────────────────────────────────────────────────────

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ALGORITHM = 'aes-256-gcm';
/** Max cookie value size before chunking. Browser limit is ~4096 per cookie
 *  including name + attributes. 3800 leaves room for name, path, flags. */
const CHUNK_SIZE = 3_800;
const BROTLI_LEVEL = 5;
/** Maximum number of cookie chunks per prefix (5 × 3800 ≈ 19KB ceiling) */
const MAX_CHUNKS = 5;

// Cookie name constants — derived from the single source of truth in errors.ts
const AID_PREFIX = COOKIE_NAMES.aid;
const STEP_PREFIX = COOKIE_NAMES.step;
const SESSION_NAME = COOKIE_NAMES.session;
const OAUTH_NAME = COOKIE_NAMES.oauth;

// ─── Encoding Utilities ─────────────────────────────────────────────────────

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/** Concatenate multiple Uint8Arrays into a single Uint8Array. */
const concatBytes = (...arrays: ReadonlyArray<Uint8Array>): Uint8Array => {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
};

// ─── Validation Schemas & Derived Types ──────────────────────────────────────

/** Schema for validating deserialized step cookie data */
const StepCookieDataSchema = Schema.Struct({
  callbacks: Schema.Array(AmCallbackSchema),
  stage: Schema.optional(Schema.String),
  header: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  authIndexType: Schema.optional(Schema.String),
  authIndexValue: Schema.optional(Schema.String),
}).annotations({ identifier: 'StepCookieData' });

/** Schema for validating deserialized session cookie data */
const SessionCookieDataSchema = Schema.Struct({
  amCookie: Schema.String,
  codeVerifier: Schema.optional(Schema.String),
}).annotations({ identifier: 'SessionCookieData' });

/** Callback input as received from AM — derived from AmCallbackSchema */
export type AmCallbackInput = { readonly name: string; readonly value: unknown };

/** AM callback structure — single source of truth is AmCallbackSchema */
export type AmCallback = Schema.Schema.Type<typeof AmCallbackSchema>;

/** Data stored in the __step cookie (compressed + encrypted) */
export type StepCookieData = Schema.Schema.Type<typeof StepCookieDataSchema>;

/** Data stored in the __session cookie (encrypted only) */
export type SessionCookieData = Schema.Schema.Type<typeof SessionCookieDataSchema>;

// ─── Key Derivation ──────────────────────────────────────────────────────────

/**
 * Derive a 32-byte AES key from a secret using HKDF-SHA256.
 * HKDF (RFC 5869) separates extraction from expansion, and the `info`
 * parameter acts as a domain separator — preventing cross-protocol attacks
 * if the same secret were reused elsewhere.
 *
 * The salt (APP_DOMAIN) provides environment isolation — the same COOKIE_SECRET
 * in dev vs staging produces different keys.
 */
const deriveKey = (secret: string, salt: string): Uint8Array =>
  new Uint8Array(hkdfSync('sha256', secret, salt, 'bff-cookie-encryption', 32));

/** Module-level cache: derived keys keyed by `secret:salt` to avoid re-deriving per request. */
const keyCache = new Map<string, Uint8Array>();

const cachedDeriveKey = (secret: string, salt: string): Uint8Array => {
  const cacheKey = `${secret}:${salt}`;
  let key = keyCache.get(cacheKey);
  if (!key) {
    key = deriveKey(secret, salt);
    keyCache.set(cacheKey, key);
  }
  return key;
};

interface DerivedKeys {
  /** Primary key (first in COOKIE_SECRET list) — used for encryption. */
  readonly primary: Uint8Array;
  /** All keys (primary + rotated) — tried in order for decryption. */
  readonly all: readonly Uint8Array[];
}

/**
 * Combinator that reads AppConfigService once and derives encryption keys.
 * Supports multi-key rotation: first key encrypts, all keys are tried for decryption.
 */
const withDerivedKeys = <A, E>(
  fn: (keys: DerivedKeys, config: AppConfig) => Effect.Effect<A, E>,
): Effect.Effect<A, E, AppConfigService> =>
  AppConfigService.pipe(
    Effect.flatMap((config) => {
      const all = config.cookieSecrets.map((s) =>
        cachedDeriveKey(Redacted.value(s), config.appDomain),
      );
      return fn({ primary: all[0], all }, config);
    }),
  );

// ─── Encrypt / Decrypt Primitives ────────────────────────────────────────────

/**
 * AES-256-GCM encrypt. Returns base64url(IV ‖ ciphertext ‖ authTag).
 * Each call generates a fresh random 12-byte IV.
 */
const encrypt = (plaintext: Uint8Array, key: Uint8Array): string => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = concatBytes(cipher.update(plaintext), cipher.final());
  const authTag = cipher.getAuthTag();
  return Encoding.encodeBase64Url(concatBytes(iv, encrypted, authTag));
};

/**
 * AES-256-GCM decrypt. Input is base64url(IV ‖ ciphertext ‖ authTag).
 * Returns the decrypted plaintext as a Uint8Array.
 */
const decrypt = (sealed: string, key: Uint8Array): Uint8Array => {
  const data = Either.getOrThrowWith(
    Encoding.decodeBase64Url(sealed),
    () => new Error('Invalid base64url encoding in sealed cookie data'),
  );
  if (data.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Sealed data too short');
  }
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(data.length - AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH, data.length - AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return concatBytes(decipher.update(ciphertext), decipher.final());
};

/**
 * Try decrypting with each key in order (newest first).
 * Returns the first successful decryption, or throws the last error.
 */
const decryptWithKeys = (sealed: string, keys: readonly Uint8Array[]): Uint8Array => {
  let lastError: unknown;
  for (const key of keys) {
    try {
      return decrypt(sealed, key);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
};

// ─── Brotli Compression (async — avoids blocking the event loop) ────────────

const brotliCompressAsync = promisify(brotliCompressCb);
const brotliDecompressAsync = promisify(brotliDecompressCb);

// ─── Cookie Chunking ─────────────────────────────────────────────────────────

/**
 * Split a sealed value into chunks if it exceeds CHUNK_SIZE.
 * Returns an array of `[cookieName, cookieValue]` pairs.
 */
const chunkCookie = (prefix: string, sealed: string): ReadonlyArray<[string, string]> => {
  if (sealed.length <= CHUNK_SIZE) {
    return [[prefix, sealed]];
  }
  const chunks: Array<[string, string]> = [];
  for (let i = 0; i * CHUNK_SIZE < sealed.length; i++) {
    chunks.push([`${prefix}.${i}`, sealed.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)]);
  }
  return chunks;
};

/**
 * Reassemble chunked cookies. Collects all `prefix.N` cookies in order,
 * or falls back to the un-chunked `prefix` cookie.
 */
const reassembleChunks = (
  prefix: string,
  cookies: ReadonlyMap<string, string>,
): string | undefined => {
  // Try un-chunked first
  const single = cookies.get(prefix);
  if (single !== undefined) return single;

  // Collect numbered chunks (capped at MAX_CHUNKS to prevent unbounded iteration)
  const chunks: string[] = [];
  for (let i = 0; i < MAX_CHUNKS; i++) {
    const chunk = cookies.get(`${prefix}.${i}`);
    if (chunk === undefined) break;
    chunks.push(chunk);
  }
  return chunks.length > 0 ? chunks.join('') : undefined;
};

// ─── Cookie Options (shared between Set-Cookie headers and SvelteKit) ───────

/** Cookie options for @effect/platform cookie serialization. */
const cookieOpts = (config: AppConfig): PlatformCookies.Cookie['options'] => ({
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: config.cookieTtl,
  secure: config.appOrigin.startsWith('https://'),
  ...(config.appDomain !== 'localhost' ? { domain: config.appDomain } : {}),
});

/** Cookie options for clearing cookies (Max-Age=0, no Secure flag). */
const clearOpts = (config: AppConfig): PlatformCookies.Cookie['options'] => ({
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: Duration.zero,
  ...(config.appDomain !== 'localhost' ? { domain: config.appDomain } : {}),
});

// ─── Parse Cookie Header ─────────────────────────────────────────────────────

/**
 * Parse a Cookie header string into a name→value map.
 * Handles the standard `name=value; name2=value2` format.
 */
export const parseCookieHeader = (header: string | null): ReadonlyMap<string, string> => {
  const map = new Map<string, string>();
  if (!header) return map;
  for (const pair of header.split(';')) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const name = pair.slice(0, eqIdx).trim();
    const value = pair.slice(eqIdx + 1).trim();
    if (name) map.set(name, value);
  }
  return map;
};

// ─── Internal Seal Core (encrypt + chunk → name/value pairs) ─────────────────

/** Encrypt authId and chunk into name/value pairs. Sync crypto (no compression). */
const sealAuthIdCore = (
  key: Uint8Array,
  authId: string,
): Effect.Effect<ReadonlyArray<[string, string]>, CookieEncryptionFailed> =>
  Effect.try({
    try: () => chunkCookie(AID_PREFIX, encrypt(textEncoder.encode(authId), key)),
    catch: (cause) => new CookieEncryptionFailed({ cookie: AID_PREFIX, cause }),
  });

/** Compress, encrypt, and chunk step data. Async for Brotli. */
const sealStepCore = (
  key: Uint8Array,
  data: StepCookieData,
): Effect.Effect<ReadonlyArray<[string, string]>, CookieEncryptionFailed> =>
  Effect.try({
    try: () => textEncoder.encode(JSON.stringify(data)),
    catch: (cause) => new CookieEncryptionFailed({ cookie: STEP_PREFIX, cause }),
  }).pipe(
    Effect.flatMap((json) =>
      Effect.tryPromise({
        try: () =>
          brotliCompressAsync(json, {
            params: { [constants.BROTLI_PARAM_QUALITY]: BROTLI_LEVEL },
          }),
        catch: (cause) => new CookieEncryptionFailed({ cookie: STEP_PREFIX, cause }),
      }).pipe(Effect.map((compressed) => chunkCookie(STEP_PREFIX, encrypt(compressed, key)))),
    ),
  );

/** Encrypt session data into a single name/value pair. Sync crypto. */
const sealSessionCore = (
  key: Uint8Array,
  data: SessionCookieData,
): Effect.Effect<[string, string], CookieEncryptionFailed> =>
  Effect.try({
    try: (): [string, string] => [
      SESSION_NAME,
      encrypt(textEncoder.encode(JSON.stringify(data)), key),
    ],
    catch: (cause) => new CookieEncryptionFailed({ cookie: SESSION_NAME, cause }),
  });

/** Encrypt OAuth query string into a single name/value pair. Sync crypto, no compression. */
const sealOauthCore = (
  key: Uint8Array,
  queryString: string,
): Effect.Effect<[string, string], CookieEncryptionFailed> =>
  Effect.try({
    try: (): [string, string] => [OAUTH_NAME, encrypt(textEncoder.encode(queryString), key)],
    catch: (cause) => new CookieEncryptionFailed({ cookie: OAUTH_NAME, cause }),
  });

// ─── Seal Functions (Encrypt → Set-Cookie header strings) ────────────────────

/** Format name/value pairs as Set-Cookie header strings using @effect/platform. */
const formatSetCookieHeaders = (
  chunks: ReadonlyArray<[string, string]>,
  config: AppConfig,
): ReadonlyArray<string> => {
  const opts = cookieOpts(config);
  return chunks.map(([name, value]) =>
    PlatformCookies.serializeCookie(PlatformCookies.unsafeMakeCookie(name, value, opts)),
  );
};

/**
 * Seal the authId JWT into one or more `__aid` Set-Cookie header strings.
 * No compression — JWT is base64url and resists compression.
 */
export const sealAuthId = (
  authId: string,
): Effect.Effect<ReadonlyArray<string>, CookieEncryptionFailed, AppConfigService> =>
  withDerivedKeys((keys, config) =>
    sealAuthIdCore(keys.primary, authId).pipe(
      Effect.map((chunks) => formatSetCookieHeaders(chunks, config)),
    ),
  );

/**
 * Seal the step data (callbacks + metadata) into one or more `__step` Set-Cookie header strings.
 * Brotli-compressed before encryption — callback JSON compresses well (~50-60%).
 * Async to avoid blocking the event loop during compression.
 */
export const sealStep = (
  data: StepCookieData,
): Effect.Effect<ReadonlyArray<string>, CookieEncryptionFailed, AppConfigService> =>
  withDerivedKeys((keys, config) =>
    sealStepCore(keys.primary, data).pipe(
      Effect.map((chunks) => formatSetCookieHeaders(chunks, config)),
    ),
  );

/**
 * Seal the session data (AM cookie + optional PKCE codeVerifier) into a single `__session` Set-Cookie header string.
 * No compression — payload is small (<800 bytes).
 */
export const sealSession = (
  data: SessionCookieData,
): Effect.Effect<string, CookieEncryptionFailed, AppConfigService> =>
  withDerivedKeys((keys, config) =>
    sealSessionCore(keys.primary, data).pipe(
      Effect.map(([name, value]) => formatSetCookieHeaders([[name, value]], config)[0]),
    ),
  );

// ─── Unseal Functions (Decrypt from Cookie Header) ───────────────────────────

/**
 * Unseal the authId from `__aid` cookie(s).
 * Reassembles chunks if needed, then decrypts.
 */
export const unsealAuthId = (
  cookies: ReadonlyMap<string, string>,
): Effect.Effect<string, CookieDecryptionFailed | CookieMissing, AppConfigService> =>
  withDerivedKeys((keys) =>
    pipe(
      Effect.fromNullable(reassembleChunks(AID_PREFIX, cookies)),
      Effect.mapError(() => new CookieMissing({ cookie: AID_PREFIX })),
      Effect.tryMap({
        try: (sealed) => textDecoder.decode(decryptWithKeys(sealed, keys.all)),
        catch: (cause) => new CookieDecryptionFailed({ cookie: AID_PREFIX, cause }),
      }),
    ),
  );

/**
 * Unseal the step data from `__step` cookie(s).
 * Reassembles chunks, decrypts, decompresses (Brotli), and validates schema.
 *
 * Crypto and schema failures are separated: decryption errors (wrong key, tampered data)
 * are distinct from schema validation errors (data decrypted but has unexpected shape).
 *
 * Uses async Brotli decompression to avoid blocking the event loop under concurrent load.
 */
export const unsealStep = (
  cookies: ReadonlyMap<string, string>,
): Effect.Effect<
  StepCookieData,
  CookieDecryptionFailed | CookieSchemaError | CookieMissing,
  AppConfigService
> =>
  withDerivedKeys((keys) =>
    pipe(
      Effect.fromNullable(reassembleChunks(STEP_PREFIX, cookies)),
      Effect.mapError(() => new CookieMissing({ cookie: STEP_PREFIX })),
      Effect.tryMap({
        try: (sealed) => decryptWithKeys(sealed, keys.all),
        catch: (cause) => new CookieDecryptionFailed({ cookie: STEP_PREFIX, cause }),
      }),
      Effect.tryMapPromise({
        try: (compressed) => brotliDecompressAsync(compressed),
        catch: (cause) => new CookieDecryptionFailed({ cookie: STEP_PREFIX, cause }),
      }),
      Effect.map((decompressed) => textDecoder.decode(decompressed)),
      Effect.flatMap((json) =>
        Schema.decodeUnknown(Schema.parseJson(StepCookieDataSchema))(json).pipe(
          Effect.catchTag('ParseError', (cause) =>
            Effect.fail(new CookieSchemaError({ cookie: STEP_PREFIX, cause })),
          ),
        ),
      ),
    ),
  );

/**
 * Unseal the session data from the `__session` cookie.
 *
 * Crypto and schema failures are separated for correct error attribution.
 */
export const unsealSession = (
  cookies: ReadonlyMap<string, string>,
): Effect.Effect<
  SessionCookieData,
  CookieDecryptionFailed | CookieSchemaError | CookieMissing,
  AppConfigService
> =>
  withDerivedKeys((keys) =>
    pipe(
      Effect.fromNullable(cookies.get(SESSION_NAME)),
      Effect.mapError(() => new CookieMissing({ cookie: SESSION_NAME })),
      Effect.tryMap({
        try: (sealed) => textDecoder.decode(decryptWithKeys(sealed, keys.all)),
        catch: (cause) => new CookieDecryptionFailed({ cookie: SESSION_NAME, cause }),
      }),
      Effect.flatMap((json) =>
        Schema.decodeUnknown(Schema.parseJson(SessionCookieDataSchema))(json).pipe(
          Effect.catchTag('ParseError', (cause) =>
            Effect.fail(new CookieSchemaError({ cookie: SESSION_NAME, cause })),
          ),
        ),
      ),
    ),
  );

/**
 * Unseal the OAuth query string from the `__oauth` cookie.
 * Plain string (no JSON, no compression) — just decrypt.
 */
export const unsealOauth = (
  cookies: ReadonlyMap<string, string>,
): Effect.Effect<string, CookieDecryptionFailed | CookieMissing, AppConfigService> =>
  withDerivedKeys((keys) =>
    pipe(
      Effect.fromNullable(cookies.get(OAUTH_NAME)),
      Effect.mapError(() => new CookieMissing({ cookie: OAUTH_NAME })),
      Effect.tryMap({
        try: (sealed) => textDecoder.decode(decryptWithKeys(sealed, keys.all)),
        catch: (cause) => new CookieDecryptionFailed({ cookie: OAUTH_NAME, cause }),
      }),
    ),
  );

// ─── Clear Cookies (Set-Cookie headers with Max-Age=0) ───────────────────────

/** Build expiry headers for a cookie prefix (un-chunked + up to MAX_CHUNKS chunked variants). */
const clearPrefixHeaders = (
  prefix: string,
  cookies: ReadonlyMap<string, string>,
  opts: PlatformCookies.Cookie['options'],
): ReadonlyArray<string> =>
  [
    cookies.has(prefix)
      ? PlatformCookies.serializeCookie(PlatformCookies.unsafeMakeCookie(prefix, '', opts))
      : undefined,
    ...Array.from({ length: MAX_CHUNKS }, (_, i) =>
      cookies.has(`${prefix}.${i}`)
        ? PlatformCookies.serializeCookie(
            PlatformCookies.unsafeMakeCookie(`${prefix}.${i}`, '', opts),
          )
        : undefined,
    ),
  ].filter((h): h is string => h !== undefined);

/**
 * Generate Set-Cookie headers that clear all auth state cookies.
 * Clears both un-chunked and chunked variants (up to MAX_CHUNKS per prefix).
 */
export const clearAllCookies = (
  cookies: ReadonlyMap<string, string>,
): Effect.Effect<ReadonlyArray<string>, never, AppConfigService> =>
  pipe(
    AppConfigService,
    Effect.map((config) => {
      const opts = clearOpts(config);
      return [
        ...clearPrefixHeaders(AID_PREFIX, cookies, opts),
        ...clearPrefixHeaders(STEP_PREFIX, cookies, opts),
        ...(cookies.has(SESSION_NAME)
          ? [
              PlatformCookies.serializeCookie(
                PlatformCookies.unsafeMakeCookie(SESSION_NAME, '', opts),
              ),
            ]
          : []),
        ...(cookies.has(OAUTH_NAME)
          ? [
              PlatformCookies.serializeCookie(
                PlatformCookies.unsafeMakeCookie(OAUTH_NAME, '', opts),
              ),
            ]
          : []),
      ];
    }),
  );

/**
 * Generate Set-Cookie headers that clear only auth ID and step cookies
 * (preserving __session for the OAuth flow).
 */
export const clearAuthCookies = (
  cookies: ReadonlyMap<string, string>,
): Effect.Effect<ReadonlyArray<string>, never, AppConfigService> =>
  pipe(
    AppConfigService,
    Effect.map((config) => {
      const opts = clearOpts(config);
      return [
        ...clearPrefixHeaders(AID_PREFIX, cookies, opts),
        ...clearPrefixHeaders(STEP_PREFIX, cookies, opts),
      ];
    }),
  );

// ─── SvelteKit Cookies Integration ───────────────────────────────────────────

/** Standard cookie options for SvelteKit's `event.cookies.set()` */
const cookieOptions = (config: AppConfig): Parameters<Cookies['set']>[2] => ({
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: Duration.toSeconds(config.cookieTtl),
  secure: config.appOrigin.startsWith('https://'),
  ...(config.appDomain !== 'localhost' ? { domain: config.appDomain } : {}),
});

/**
 * Cookie identity options for SvelteKit's `cookies.delete()`.
 *
 * SvelteKit keys its internal cookie state by (name, domain, path).
 * If `delete()` uses different options than `set()`, they create separate
 * entries — `getAll()` returns both, and the empty deleted value can
 * shadow the encrypted set value. These options must match `cookieOptions`.
 */
const deleteOptions = (config: AppConfig): Parameters<Cookies['delete']>[1] => ({
  path: '/',
  ...(config.appDomain !== 'localhost' ? { domain: config.appDomain } : {}),
});

/** Delete old cookies for a prefix, then write new sealed chunks. */
const replaceChunkedCookies = (
  svelteCookies: Cookies,
  prefix: string,
  chunks: ReadonlyArray<[string, string]>,
  config: AppConfig,
): void => {
  deleteCookiesByPrefix(svelteCookies, prefix, config);
  const opts = cookieOptions(config);
  for (const [name, value] of chunks) {
    svelteCookies.set(name, value, opts);
  }
};

/**
 * Set sealed authId cookies using SvelteKit's Cookies API.
 * Composes with sealAuthIdCore — shared crypto logic, no duplication.
 */
export const setCookieAuthId = (
  svelteCookies: Cookies,
  authId: string,
): Effect.Effect<void, CookieEncryptionFailed, AppConfigService> =>
  withDerivedKeys((keys, config) =>
    sealAuthIdCore(keys.primary, authId).pipe(
      Effect.tap((chunks) =>
        Effect.sync(() => replaceChunkedCookies(svelteCookies, AID_PREFIX, chunks, config)),
      ),
      Effect.asVoid,
    ),
  );

/**
 * Set sealed step cookies using SvelteKit's Cookies API.
 * Composes with sealStepCore — shared crypto logic, no duplication.
 */
export const setCookieStep = (
  svelteCookies: Cookies,
  data: StepCookieData,
): Effect.Effect<void, CookieEncryptionFailed, AppConfigService> =>
  withDerivedKeys((keys, config) =>
    sealStepCore(keys.primary, data).pipe(
      Effect.tap((chunks) =>
        Effect.sync(() => replaceChunkedCookies(svelteCookies, STEP_PREFIX, chunks, config)),
      ),
      Effect.asVoid,
    ),
  );

/**
 * Set sealed session cookie using SvelteKit's Cookies API.
 * Composes with sealSessionCore — shared crypto logic, no duplication.
 */
export const setCookieSession = (
  svelteCookies: Cookies,
  data: SessionCookieData,
): Effect.Effect<void, CookieEncryptionFailed, AppConfigService> =>
  withDerivedKeys((keys, config) =>
    sealSessionCore(keys.primary, data).pipe(
      Effect.tap(([name, value]) =>
        Effect.sync(() => svelteCookies.set(name, value, cookieOptions(config))),
      ),
      Effect.asVoid,
    ),
  );

/**
 * Set sealed OAuth cookie using SvelteKit's Cookies API.
 * Stores the original authorize query string so the login page can redirect
 * back to /api/authorize after authentication completes.
 */
export const setCookieOauth = (
  svelteCookies: Cookies,
  queryString: string,
): Effect.Effect<void, CookieEncryptionFailed, AppConfigService> =>
  withDerivedKeys((keys, config) =>
    sealOauthCore(keys.primary, queryString).pipe(
      Effect.tap(([name, value]) =>
        Effect.sync(() => svelteCookies.set(name, value, cookieOptions(config))),
      ),
      Effect.asVoid,
    ),
  );

/**
 * Read cookies from SvelteKit's Cookies API into a Map for unseal functions.
 */
export const readCookiesAsMap = (svelteCookies: Cookies): ReadonlyMap<string, string> => {
  const all = svelteCookies.getAll();
  return new Map(all.map((c) => [c.name, c.value]));
};

/** Delete all cookies matching a prefix (un-chunked + chunked variants) */
const deleteCookiesByPrefix = (svelteCookies: Cookies, prefix: string, config: AppConfig): void => {
  const opts = deleteOptions(config);
  svelteCookies.delete(prefix, opts);
  for (let i = 0; i < MAX_CHUNKS; i++) {
    svelteCookies.delete(`${prefix}.${i}`, opts);
  }
};

/** Clear all auth state cookies via SvelteKit's Cookies API */
export const deleteAllCookies = (svelteCookies: Cookies, config: AppConfig): void => {
  deleteCookiesByPrefix(svelteCookies, AID_PREFIX, config);
  deleteCookiesByPrefix(svelteCookies, STEP_PREFIX, config);
  svelteCookies.delete(SESSION_NAME, deleteOptions(config));
  svelteCookies.delete(OAUTH_NAME, deleteOptions(config));
};

/** Clear auth cookies but preserve __session and __oauth (for OAuth flow) */
export const deleteAuthCookies = (svelteCookies: Cookies, config: AppConfig): void => {
  deleteCookiesByPrefix(svelteCookies, AID_PREFIX, config);
  deleteCookiesByPrefix(svelteCookies, STEP_PREFIX, config);
};

/** Clear only the __session cookie (preserves __oauth for retry scenarios) */
export const deleteSessionCookie = (svelteCookies: Cookies, config: AppConfig): void => {
  svelteCookies.delete(SESSION_NAME, deleteOptions(config));
};

/** Clear only the __oauth cookie (consumed after redirect back to /api/authorize) */
export const deleteOauthCookie = (svelteCookies: Cookies, config: AppConfig): void => {
  svelteCookies.delete(OAUTH_NAME, deleteOptions(config));
};
