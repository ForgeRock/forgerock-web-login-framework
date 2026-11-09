/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { afterAll, afterEach, describe, expect, it } from 'vitest';

import { createMetricsServer, getMetricsPort } from './metricsServer';

// Parallel vitest files each start this listener, so every suite binds its
// own offset port instead of the default 9090 (aic-mcp port-offset
// discipline).
const PORT = getMetricsPort() + 30;

async function get(path: string): Promise<Response> {
  const response = await fetch(`http://127.0.0.1:${PORT}${path}`);
  return response;
}

describe('metrics server', () => {
  const server = createMetricsServer();

  server.listen(PORT);

  afterAll(() => {
    server.close();
  });

  it('serves /metrics with the Prometheus text exposition content type', async () => {
    const response = await get('/metrics');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const body = await response.text();
    expect(body).toContain('login_app_up 1');
  });

  it('404s every other path, keeping the listener single-purpose', async () => {
    const response = await get('/');

    expect(response.status).toBe(404);
  });
});

describe('getMetricsPort', () => {
  const original = process.env.METRICS_PORT;

  afterEach(() => {
    if (original === undefined) delete process.env.METRICS_PORT;
    else process.env.METRICS_PORT = original;
  });

  it('parses a valid port', () => {
    process.env.METRICS_PORT = '9123';
    expect(getMetricsPort()).toBe(9123);
  });

  it('falls back to the default for a malformed value instead of NaN', () => {
    process.env.METRICS_PORT = 'not-a-port';
    expect(getMetricsPort()).toBe(9090);
  });

  it('falls back to the default for an out-of-range value', () => {
    process.env.METRICS_PORT = '99999';
    expect(getMetricsPort()).toBe(9090);
  });
});
