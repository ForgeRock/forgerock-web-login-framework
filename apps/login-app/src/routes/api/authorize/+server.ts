import type { RequestHandler } from './$types';

import { redirect } from '@sveltejs/kit';
import { Effect, pipe } from 'effect';

import { buildAuthorizeQuery, validateRedirectOrigin } from '$server/authorize';
import {
  deleteAllCookies,
  readCookiesAsMap,
  setCookieOauth,
  unsealSession,
} from '$server/cookie-crypto';
import { BffClientError, BffInternalError } from '$server/errors';
import { checkRateLimit } from '$server/request';
import { handleRouteAsValue, run, type RequestContext } from '$server/run';
import { AmProxyService } from '$server/services/am-proxy';
import { AppConfigService } from '$server/services/app-config';

/** Save authorize query params to an __oauth cookie and signal login redirect. */
const saveOauthAndNeedsLogin = (event: Parameters<RequestHandler>[0]) =>
  setCookieOauth(event.cookies, event.url.searchParams.toString()).pipe(
    Effect.as({ _tag: 'needsLogin' as const }),
    Effect.catchTag('CookieEncryptionFailed', (err) =>
      Effect.logError('Cookie encryption failed during OAuth state save').pipe(
        Effect.annotateLogs({ cookie: err.cookie, cause: String(err.cause) }),
        Effect.flatMap(() =>
          Effect.fail(new BffInternalError({ message: 'Failed to save OAuth state' })),
        ),
      ),
    ),
  );

/**
 * GET /api/authorize
 *
 * Server-side OAuth2 authorization initiation.
 *
 * Two modes:
 * 1. **No `__session` cookie** (first visit): Stores the authorize query params
 *    in an encrypted `__oauth` cookie and redirects to `/` to start login.
 * 2. **Has `__session` cookie** (after login): Reads the AM cookie + PKCE
 *    code_verifier, builds the authorize URL, and proxies to AM.
 *    AM responds with a redirect to the customer's redirect_uri with ?code=xxx.
 *
 * After successful authorize, all BFF cookies are cleared — the gateway's job is done.
 *
 * Uses SvelteKit's `redirect()` throw (not a Response with 302 status) so that
 * adapter-node sends a real HTTP 302 to the browser. A standard 302 Response
 * would be resolved server-side by SvelteKit for same-origin redirect_uri values,
 * which drops Set-Cookie headers and prevents the browser URL from updating.
 */
export const GET: RequestHandler = async (event) => {
  const context: RequestContext = { method: event.request.method, pathname: event.url.pathname };

  // Cannot use handleRoute() — SvelteKit's redirect() throws, so the pipeline
  // produces Response | never (redirect throws before returning). handleRoute
  // requires Effect<Response, ...> which is incompatible with throw-based redirects.
  //
  // Pipeline produces either:
  // - { _tag: 'redirect', url: string } — a validated redirect URL (auth code flow complete)
  // - { _tag: 'needsLogin' } — no session, __oauth cookie set, redirect to login
  // Errors are converted to HTTP error Responses via the standard BFF error handling.
  //
  // CookieMissing / CookieDecryptionFailed are caught at the pipeline level (not inside
  // the bind) so the success path stays linear and TypeScript can infer the union type
  // from catchTag's success widening.
  const result = await checkRateLimit(event.getClientAddress(), '/api/authorize').pipe(
    Effect.andThen(
      Effect.all({
        config: AppConfigService,
        amProxy: AmProxyService,
        session: pipe(event.cookies, readCookiesAsMap, unsealSession),
      }),
    ),
    Effect.flatMap(({ config, amProxy, session }) =>
      Effect.fromNullable(session.codeVerifier).pipe(
        Effect.mapError(
          () =>
            new BffClientError({
              status: 400,
              message: 'PKCE code_verifier missing from session',
            }),
        ),
        Effect.flatMap((codeVerifier) =>
          amProxy
            .authorize({
              cookie: session.amCookie,
              queryString: buildAuthorizeQuery(
                event.url.search,
                codeVerifier,
                config.oauthClientId,
              ),
            })
            .pipe(
              Effect.flatMap(({ redirectUrl }) =>
                validateRedirectOrigin(redirectUrl, config.appOrigin),
              ),
            ),
        ),
        Effect.tap(() => Effect.sync(() => deleteAllCookies(event.cookies, config))),
        Effect.map((url) => ({ _tag: 'redirect' as const, url })),
      ),
    ),
    // No session or corrupted session → save OAuth params and redirect to login
    Effect.catchTag('CookieMissing', () => saveOauthAndNeedsLogin(event)),
    Effect.catchTag('CookieDecryptionFailed', (err) =>
      Effect.logWarning('Session cookie decryption failed in authorize — starting fresh').pipe(
        Effect.annotateLogs({ cookie: err.cookie, cause: String(err.cause) }),
        Effect.flatMap(() => saveOauthAndNeedsLogin(event)),
      ),
    ),
    Effect.catchTag('CookieSchemaError', (err) =>
      Effect.logWarning('Session cookie schema mismatch in authorize — starting fresh').pipe(
        Effect.annotateLogs({ cookie: err.cookie }),
        Effect.flatMap(() => saveOauthAndNeedsLogin(event)),
      ),
    ),
    handleRouteAsValue(context),
    run,
  );

  // handleRouteAsValue converts errors to web Response objects.
  if (result instanceof Response) {
    return result;
  }

  // TypeScript now knows: result is { _tag: 'redirect'; url: string } | { _tag: 'needsLogin' }
  if (result._tag === 'redirect') {
    redirect(302, result.url);
  }

  // result._tag === 'needsLogin'
  redirect(302, '/');
};
