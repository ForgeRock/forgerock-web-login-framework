import type { RequestHandler } from './$types';

import { HttpServerResponse } from '@effect/platform';
import { Effect, pipe } from 'effect';

import { loadLocaleContent } from '$server/locale';
import { handleRoute, run } from '$server/run';

export const GET: RequestHandler = (event) =>
  pipe(
    loadLocaleContent(event.request.headers.get('accept-language') || 'en-US'),
    Effect.flatMap((content) => HttpServerResponse.json(content)),
    Effect.orDie,
    handleRoute({ method: event.request.method, pathname: event.url.pathname }),
    run,
  );
