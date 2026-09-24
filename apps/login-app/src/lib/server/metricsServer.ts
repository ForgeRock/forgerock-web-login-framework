/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import http from 'node:http';

import { renderMetrics } from '$server/metrics';

/**
 * Dedicated Prometheus metrics listener, separate from the application port
 * (saas Kubernetes standard: /metrics on its own port, not externally
 * exposed). Serving it here, rather than as a SvelteKit route, keeps the
 * NetworkPolicy scoping exact: org-monitoring's Prometheus may reach only
 * this port, never the app listener that serves user traffic.
 *
 * The returned server is not bound; the caller listens on
 * `getMetricsPort()`.
 */
export function createMetricsServer(): http.Server {
  const server = http.createServer(async (_req, res) => {
    if (_req.url !== '/metrics') {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    try {
      const body = await renderMetrics();
      res.statusCode = 200;
      res.setHeader('content-type', 'text/plain; version=0.0.4; charset=utf-8');
      res.end(body);
    } catch (error) {
      console.error('Error rendering /metrics:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });

  return server;
}

/** Metrics listen port; read at call time so tests can set METRICS_PORT. */
export function getMetricsPort(): number {
  return parseInt(process.env.METRICS_PORT ?? '9090', 10);
}
