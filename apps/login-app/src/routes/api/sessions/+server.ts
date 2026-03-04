import type { RequestHandler } from './$types';

import { Effect, pipe } from 'effect';

import { deleteAllCookies, readCookiesAsMap, unsealSession } from '$server/cookie-crypto';
import { amResponseToHttp } from '$server/error-response';
import { checkRateLimit } from '$server/request';
import { handleRoute, run } from '$server/run';
import { AmProxyService } from '$server/services/am-proxy';
import { AppConfigService } from '$server/services/app-config';

/**
 * POST /api/sessions — AM session logout.
 * Reads the AM cookie from `__session`, calls AM's session logout endpoint,
 * and clears all BFF cookies.
 */
export const POST: RequestHandler = (event) =>
  pipe(
    checkRateLimit(event.getClientAddress(), '/api/sessions'),
    Effect.andThen(
      Effect.all({
        config: AppConfigService,
        amProxy: AmProxyService,
        session: unsealSession(readCookiesAsMap(event.cookies)),
      }),
    ),
    Effect.flatMap(({ config, amProxy, session }) =>
      amProxy
        .logout({
          cookie: session.amCookie,
          queryString: event.url.search.slice(1),
        })
        .pipe(
          Effect.tap(() => Effect.sync(() => deleteAllCookies(event.cookies, config))),
          Effect.map(amResponseToHttp),
        ),
    ),
    handleRoute({ method: event.request.method, pathname: event.url.pathname }),
    run,
  );
