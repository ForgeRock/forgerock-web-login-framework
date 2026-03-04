import { Headers as PlatformHeaders, UrlParams } from '@effect/platform';
import type { Cookies } from '@sveltejs/kit';
import { Effect, Option, Schema, pipe } from 'effect';

import { AmStepResponse, isAuthComplete } from '$server/am-response-schemas';
import {
  deleteAuthCookies,
  deleteOauthCookie,
  deleteSessionCookie,
  setCookieAuthId,
  setCookieSession,
  setCookieStep,
  unsealOauth,
  unsealSession,
  type StepCookieData,
} from '$server/cookie-crypto';
import { BffClientError, BffInternalError, SessionCorrupted } from '$server/errors';
import { parseAmErrorMessage } from '$server/error-response';
import { FormActionResult } from '$server/run';
import { type AmResponse } from '$server/services/am-proxy';
import { AppConfigService, type AppConfig } from '$server/services/app-config';
import { generateCodeVerifier } from '$server/pkce';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuthIndexParams {
  readonly authIndexType?: string;
  readonly authIndexValue?: string;
}

// ─── Cookie Loading ─────────────────────────────────────────────────────────

/**
 * Load session data — returns undefined when the cookie is absent (legitimate first visit),
 * but fails with SessionCorrupted when the cookie is present but cannot be decrypted.
 * This distinction prevents sending empty/stale credentials to AM.
 */
export const loadOptionalSession = (cookies: ReadonlyMap<string, string>) =>
  unsealSession(cookies).pipe(
    Effect.catchTag('CookieMissing', () => Effect.succeed(undefined)),
    Effect.catchTag('CookieDecryptionFailed', (err) =>
      failWithLog(
        Effect.logWarning,
        'Session cookie decryption failed — possible key rotation or tampering',
        new SessionCorrupted({ cookie: err.cookie, cause: err.cause }),
        { cookie: err.cookie, cause: String(err.cause) },
      ),
    ),
    Effect.catchTag('CookieSchemaError', (err) =>
      failWithLog(
        Effect.logWarning,
        'Session cookie schema validation failed — possible version mismatch',
        new SessionCorrupted({ cookie: err.cookie, cause: err.cause }),
        { cookie: err.cookie, cause: String(err.cause) },
      ),
    ),
  );

/**
 * Load OAuth query string — returns undefined when absent,
 * fails with SessionCorrupted when present but corrupt.
 */
export const loadOptionalOauth = (cookies: ReadonlyMap<string, string>) =>
  unsealOauth(cookies).pipe(
    Effect.catchTag('CookieMissing', () => Effect.succeed(undefined)),
    Effect.catchTag('CookieDecryptionFailed', (err) =>
      failWithLog(
        Effect.logWarning,
        'OAuth cookie decryption failed — possible key rotation or tampering',
        new SessionCorrupted({ cookie: err.cookie, cause: err.cause }),
        { cookie: err.cookie, cause: String(err.cause) },
      ),
    ),
  );

// ─── Query Params ───────────────────────────────────────────────────────────

/** Extract and normalize auth-index query params for the init action. */
export const buildInitQueryParams = (searchParams: URLSearchParams) => {
  const authIndexType = searchParams.get('authIndexType') ?? 'service';
  const authIndexValue =
    searchParams.get('authIndexValue') ??
    searchParams.get('journey') ??
    searchParams.get('tree') ??
    '';

  return {
    authIndexType,
    authIndexValue,
    queryString: authIndexValue
      ? pipe(UrlParams.fromInput({ authIndexType, authIndexValue }), UrlParams.toString)
      : '',
  };
};

// ─── AM Response Processing ─────────────────────────────────────────────────

/**
 * Extract the AM session cookie (as `name=value`) from a Set-Cookie header
 * that may contain multiple comma-joined entries.
 *
 * Uses a regex anchored on the cookie name instead of splitting on ", " —
 * naive splitting breaks when Set-Cookie values contain Expires dates
 * (e.g., `Expires=Thu, 01 Jan 2025 00:00:00 GMT`).
 */
const extractAmCookie = (
  headers: PlatformHeaders.Headers,
  cookieName: string,
): string | undefined => {
  const raw = PlatformHeaders.get(headers, 'set-cookie');
  if (Option.isNone(raw)) return undefined;

  const escaped = cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`(?:^|,\\s*)${escaped}=([^;]*)`).exec(raw.value);
  return match ? `${cookieName}=${match[1].trim()}` : undefined;
};

/** Pick only the fields the page needs from step data. */
const stepView = (s: StepCookieData) => ({
  callbacks: s.callbacks,
  stage: s.stage,
  header: s.header,
  description: s.description,
});

/** Log with annotations, then fail with the given error. */
const failWithLog = <E>(
  logLevel: typeof Effect.logError,
  label: string,
  error: E,
  annotations: Record<string, string>,
): Effect.Effect<never, E> =>
  pipe(logLevel(label), Effect.annotateLogs(annotations), Effect.andThen(Effect.fail(error)));

/**
 * Process an AM response: detect auth completion vs. next step,
 * set appropriate cookies, and return data for the page.
 */
export const processAmResponse = (
  amResponse: AmResponse,
  config: AppConfig,
  svelteCookies: Cookies,
  authIndexParams: AuthIndexParams,
  oauthQuery?: string,
): Effect.Effect<FormActionResult, BffClientError | BffInternalError, AppConfigService> => {
  const amCookieValue = extractAmCookie(amResponse.headers, config.amCookieName);

  if (isAuthComplete(amResponse.body)) {
    return handleAuthComplete(svelteCookies, amCookieValue, config, oauthQuery);
  }
  if (amResponse.status >= 400) {
    return handleAmError(amResponse, svelteCookies, config);
  }
  return handleNextStep(amResponse, svelteCookies, amCookieValue, authIndexParams);
};

/**
 * Auth flow complete — clear auth cookies, prepare for OAuth.
 *
 * Design note: crypto failures here return a FormActionResult.error (HTTP 200 with error message)
 * rather than a 5xx, because the form action response must be valid for progressive enhancement.
 * The failure is logged via Effect.logError for operational visibility.
 */
const handleAuthComplete = (
  svelteCookies: Cookies,
  amCookieValue: string | undefined,
  config: AppConfig,
  oauthQuery?: string,
): Effect.Effect<FormActionResult, never, AppConfigService> =>
  pipe(
    Effect.sync(() => {
      deleteAuthCookies(svelteCookies, config);
      if (oauthQuery) deleteOauthCookie(svelteCookies, config);
    }),
    Effect.andThen(() => {
      if (!amCookieValue) {
        return pipe(
          Effect.logWarning('Auth complete but AM cookie missing — cannot start OAuth flow'),
          Effect.as(
            FormActionResult.error(
              'Authentication completed but session could not be established. Please try again.',
            ),
          ),
        );
      }

      const codeVerifier = generateCodeVerifier();
      return setCookieSession(svelteCookies, { amCookie: amCookieValue, codeVerifier }).pipe(
        Effect.as(
          FormActionResult.authComplete(oauthQuery ? `/api/authorize?${oauthQuery}` : undefined),
        ),
        Effect.catchTag('CookieEncryptionFailed', (err) =>
          pipe(
            Effect.logError('Failed to encrypt session cookie'),
            Effect.annotateLogs({ cookie: err.cookie, cause: String(err.cause) }),
            Effect.as(
              FormActionResult.error(
                'Authentication succeeded but session could not be saved. Please try again.',
              ),
            ),
          ),
        ),
      );
    }),
  );

/** AM returned an error — clear auth cookies but preserve __oauth for retry */
const handleAmError = (
  amResponse: AmResponse,
  svelteCookies: Cookies,
  config: AppConfig,
): Effect.Effect<FormActionResult, never> => {
  deleteAuthCookies(svelteCookies, config);
  deleteSessionCookie(svelteCookies, config);

  return parseAmErrorMessage(amResponse.body).pipe(
    Effect.map((errorMessage) => FormActionResult.error(errorMessage)),
  );
};

/** AM returned a next step — store in cookies and return step data */
const handleNextStep = (
  amResponse: AmResponse,
  svelteCookies: Cookies,
  amCookieValue: string | undefined,
  authIndexParams: AuthIndexParams,
): Effect.Effect<FormActionResult, BffClientError | BffInternalError, AppConfigService> => {
  const persistCookies = (authId: string, stepData: StepCookieData) =>
    Effect.all(
      [
        setCookieAuthId(svelteCookies, authId),
        setCookieStep(svelteCookies, stepData),
        ...(amCookieValue ? [setCookieSession(svelteCookies, { amCookie: amCookieValue })] : []),
      ],
      { concurrency: 'unbounded' },
    );

  return Schema.decodeUnknown(Schema.parseJson(AmStepResponse))(amResponse.body).pipe(
    Effect.map((parsed) => ({
      authId: parsed.authId,
      stepData: {
        ...stepView(parsed),
        authIndexType: authIndexParams.authIndexType,
        authIndexValue: authIndexParams.authIndexValue,
      } satisfies StepCookieData,
    })),
    Effect.tap(({ authId, stepData }) => persistCookies(authId, stepData)),
    Effect.map(({ stepData }) => FormActionResult.step(stepView(stepData))),
    Effect.catchTag('CookieEncryptionFailed', (err) =>
      failWithLog(
        Effect.logError,
        'Failed to encrypt cookies for next step',
        new BffInternalError({ message: 'Failed to store authentication state' }),
        { cookie: err.cookie, cause: String(err.cause) },
      ),
    ),
    Effect.catchTag('ParseError', (parseError) =>
      failWithLog(
        Effect.logWarning,
        'Failed to parse AM step response',
        new BffClientError({
          status: 502,
          message: 'Unexpected response from authentication service',
        }),
        {
          hint: 'Response may be an unrecognized auth-complete format',
          amStatus: String(amResponse.status),
          error: String(parseError).slice(0, 200),
          body: amResponse.body.slice(0, 200),
        },
      ),
    ),
  );
};
