import { Effect, pipe } from 'effect';
import { UrlParams } from '@effect/platform';
import { BffClientError } from '$server/errors';
import { computeCodeChallenge, CodeVerifier } from '$server/pkce';

/**
 * Build the OAuth2 authorize query string with PKCE code_challenge.
 * Preserves any existing search params (scope, redirect_uri, etc.)
 * and appends the PKCE and client parameters.
 */
export const buildAuthorizeQuery = (
  search: string,
  codeVerifier: string,
  clientId: string,
): string =>
  pipe(
    UrlParams.fromInput(new URLSearchParams(search)),
    UrlParams.set('code_challenge', computeCodeChallenge(CodeVerifier(codeVerifier))),
    UrlParams.set('code_challenge_method', 'S256'),
    UrlParams.set('client_id', clientId),
    UrlParams.set('response_type', 'code'),
    UrlParams.toString,
  );

/**
 * Validate that the redirect URL returned by AM matches the expected
 * application origin. Prevents open-redirect attacks where AM could
 * be tricked into redirecting to a malicious domain.
 */
export const validateRedirectOrigin = (
  redirectUrl: string,
  appOrigin: string,
): Effect.Effect<string, BffClientError> =>
  Effect.try({
    try: () => new URL(redirectUrl),
    catch: () => new BffClientError({ status: 400, message: 'AM returned invalid redirect URL' }),
  }).pipe(
    Effect.filterOrFail(
      (url) => url.origin === appOrigin && url.pathname.startsWith('/'),
      () => new BffClientError({ status: 400, message: 'Redirect URL origin mismatch' }),
    ),
    Effect.as(redirectUrl),
  );
