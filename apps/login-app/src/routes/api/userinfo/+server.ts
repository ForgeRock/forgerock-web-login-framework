import type { RequestHandler } from './$types';

import { Effect, pipe } from 'effect';

import { checkRateLimit, requireAuthorization } from '$server/request';
import { amResponseToHttp } from '$server/error-response';
import { handleRoute, run } from '$server/run';
import { AmProxyService } from '$server/services/am-proxy';

/**
 * GET /api/userinfo — Proxy for AM's /userinfo endpoint.
 * Requires Authorization header (Bearer token).
 */
export const GET: RequestHandler = (event) =>
  pipe(
    checkRateLimit(event.getClientAddress(), '/api/userinfo'),
    Effect.andThen(
      Effect.all({ amProxy: AmProxyService, authorization: requireAuthorization(event.request) }),
    ),
    Effect.flatMap(({ amProxy, authorization }) => amProxy.getUserInfo({ authorization })),
    Effect.map(amResponseToHttp),
    handleRoute({ method: event.request.method, pathname: event.url.pathname }),
    run,
  );
