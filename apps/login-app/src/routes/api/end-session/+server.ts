import type { RequestHandler } from './$types';

import { Effect, pipe } from 'effect';

import { checkRateLimit, requireAuthorization } from '$server/request';
import { amResponseToHttp } from '$server/error-response';
import { handleRoute, run } from '$server/run';
import { AmProxyService } from '$server/services/am-proxy';

/**
 * GET /api/end-session — OIDC RP-Initiated Logout.
 * Proxies to AM's /connect/endSession endpoint.
 * Requires Authorization header (id_token_hint).
 */
export const GET: RequestHandler = (event) =>
  pipe(
    checkRateLimit(event.getClientAddress(), '/api/end-session'),
    Effect.andThen(
      Effect.all({ amProxy: AmProxyService, authorization: requireAuthorization(event.request) }),
    ),
    Effect.flatMap(({ amProxy, authorization }) =>
      amProxy.endSession({ authorization, queryString: event.url.search.slice(1) }),
    ),
    Effect.map(amResponseToHttp),
    handleRoute({ method: event.request.method, pathname: event.url.pathname }),
    run,
  );
