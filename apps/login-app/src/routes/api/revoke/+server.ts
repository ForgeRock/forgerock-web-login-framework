import type { RequestHandler } from './$types';

import { Effect, pipe } from 'effect';

import { checkRateLimit, readRequestBody } from '$server/request';
import { amResponseToHttp } from '$server/error-response';
import { handleRoute, run } from '$server/run';
import { AmProxyService } from '$server/services/am-proxy';

/**
 * POST /api/revoke — Proxy for AM's /token/revoke endpoint.
 */
export const POST: RequestHandler = (event) =>
  pipe(
    checkRateLimit(event.getClientAddress(), '/api/revoke'),
    Effect.andThen(Effect.all({ amProxy: AmProxyService, body: readRequestBody(event.request) })),
    Effect.flatMap(({ amProxy, body }) => amProxy.revokeTokens({ body })),
    Effect.map(amResponseToHttp),
    handleRoute({ method: event.request.method, pathname: event.url.pathname }),
    run,
  );
