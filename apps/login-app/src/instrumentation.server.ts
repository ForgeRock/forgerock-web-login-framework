/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { createMetricsServer, getMetricsPort } from '$server/metricsServer';

/**
 * SvelteKit server instrumentation: starts the dedicated Prometheus metrics
 * listener before application code loads (kit.experimental.instrumentation).
 * The listener is intentionally not awaited so server startup never blocks on
 * it; a bind failure is logged, never fatal to the app.
 */
const metricsServer = createMetricsServer();

metricsServer.listen(getMetricsPort(), () => {
  console.error(`Login app metrics server listening on port ${getMetricsPort()} (path /metrics)`);
});

metricsServer.on('error', (error) => {
  console.error('Login app metrics server failed to start:', error);
});
