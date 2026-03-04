import type { RequestHandler } from './$types';

import { Effect } from 'effect';

import { catchDefect } from '$server/error-response';
import { run } from '$server/run';
import { OidcDiscoveryService } from '$server/services/oidc-discovery';

/**
 * GET /api/health — Kubernetes readiness probe.
 *
 * Returns 200 when OIDC discovery has completed (server is ready to handle requests),
 * or 503 when discovery is still in progress (server just started, AM may be unreachable).
 * Bypasses `handleRoute` — this endpoint IS the readiness check.
 */
export const GET: RequestHandler = () =>
  OidcDiscoveryService.pipe(
    Effect.flatMap((discovery) => discovery.isReady),
    Effect.map((ready) =>
      ready
        ? Response.json({ status: 'ready' }, { status: 200 })
        : Response.json({ status: 'starting', discovery: false }, { status: 503 }),
    ),
    Effect.catchAllDefect(
      catchDefect('health check', (ref) =>
        Response.json({ status: 'error', ref }, { status: 503 }),
      ),
    ),
    run,
  );
