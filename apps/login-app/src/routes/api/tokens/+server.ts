import type { RequestHandler } from './$types';

import { Effect, pipe } from 'effect';

import { checkRateLimit, readRequestBody } from '$server/request';
import { amResponseToHttp } from '$server/error-response';
import { handleRoute, run } from '$server/run';
import { AmProxyService } from '$server/services/am-proxy';

/**
 * POST /api/tokens
 *
 * Proxy for AM's /access_token endpoint.
 * The customer's server calls this with the authorization_code + code_verifier
 * to exchange for tokens. The BFF passes through — no session state needed.
 *
 * Note: The code_verifier was generated server-side during authentication and
 * included in the authorize redirect. The customer's server extracts it from
 * the redirect URL and sends it here for the token exchange.
 */
export const POST: RequestHandler = (event) =>
  pipe(
    checkRateLimit(event.getClientAddress(), '/api/tokens'),
    Effect.andThen(Effect.all({ amProxy: AmProxyService, body: readRequestBody(event.request) })),
    Effect.flatMap(({ amProxy, body }) => amProxy.getTokens({ body })),
    Effect.map(amResponseToHttp),
    handleRoute({ method: event.request.method, pathname: event.url.pathname }),
    run,
  );
