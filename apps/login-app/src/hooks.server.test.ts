/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv = vi.hoisted(() => ({}) as Record<string, string | undefined>);

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

import { DEFAULT_CSP_ENFORCED, DEFAULT_CSP_REPORT_ONLY } from '$server/csp.utilities';
import { registryReset, renderMetrics } from '$server/metrics';
import { handle } from './hooks.server';

function mockEvent(url: string, host?: string, method = 'GET') {
  return {
    url: new URL(url),
    request: {
      headers: new Headers(host ? { host } : {}),
      method,
    },
  } as unknown as Parameters<typeof handle>[0]['event'];
}

function mockResolve(response: Response) {
  return (async () => response) as unknown as Parameters<typeof handle>[0]['resolve'];
}

async function requestCount(): Promise<number> {
  const body = await renderMetrics();
  return body
    .split('\n')
    .filter((line) => line.startsWith('login_app_requests_total{'))
    .reduce((sum, line) => sum + Number(line.slice(line.lastIndexOf(' ') + 1)), 0);
}

function htmlResponse() {
  return new Response('<main></main>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

describe('hooks.server handle', () => {
  beforeEach(() => {
    for (const key of Object.keys(mockEnv)) {
      delete mockEnv[key];
    }
    mockEnv.FR_AM_URL = 'https://openam.example.com/am';
    mockEnv.FR_REALM_PATH = 'root';
    registryReset();
  });

  it('retains security/cache headers and default CSP for admin HTML even when env policies are empty', async () => {
    mockEnv.CSP_ENFORCED = '';
    mockEnv.CSP_REPORT_ONLY = '';

    const response = htmlResponse();
    const event = mockEvent('https://openam.example.com/login?realm=/', 'openam.example.com');

    const result = await handle({ event, resolve: mockResolve(response) });

    expect(result.headers.get('Cache-Control')).toBe('no-cache, no-store');
    expect(result.headers.get('Edge-Control')).toBe('no-store');
    expect(result.headers.get('Pragma')).toBe('no-cache');
    expect(result.headers.get('Referrer-Policy')).toBe('origin');
    expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(result.headers.get('Content-Security-Policy')).toBe(DEFAULT_CSP_ENFORCED);
    expect(result.headers.get('Content-Security-Policy-Report-Only')).toBe(DEFAULT_CSP_REPORT_ONLY);
  });

  it('propagates customer CSP values for alpha HTML while retaining security/cache headers', async () => {
    mockEnv.CSP_ENFORCED = "frame-ancestors 'self' https://alpha.example.com";
    mockEnv.CSP_REPORT_ONLY = "default-src 'self'; report-uri https://reports.example.com";

    const response = htmlResponse();
    const event = mockEvent('https://openam.example.com/login?realm=/alpha', 'openam.example.com');

    const result = await handle({ event, resolve: mockResolve(response) });

    expect(result.headers.get('Cache-Control')).toBe('no-cache, no-store');
    expect(result.headers.get('Edge-Control')).toBe('no-store');
    expect(result.headers.get('Pragma')).toBe('no-cache');
    expect(result.headers.get('Referrer-Policy')).toBe('origin');
    expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(result.headers.get('Content-Security-Policy')).toBe(
      "frame-ancestors 'self' https://alpha.example.com",
    );
    expect(result.headers.get('Content-Security-Policy-Report-Only')).toBe(
      "default-src 'self'; report-uri https://reports.example.com",
    );
  });

  it('omits explicitly disabled customer CSP headers for bravo while retaining security/cache headers', async () => {
    mockEnv.CSP_ENFORCED = '';
    mockEnv.CSP_REPORT_ONLY = '';

    const response = htmlResponse();
    const event = mockEvent('https://openam.example.com/login?realm=/bravo', 'openam.example.com');

    const result = await handle({ event, resolve: mockResolve(response) });

    expect(result.headers.get('Cache-Control')).toBe('no-cache, no-store');
    expect(result.headers.get('Edge-Control')).toBe('no-store');
    expect(result.headers.get('Pragma')).toBe('no-cache');
    expect(result.headers.get('Referrer-Policy')).toBe('origin');
    expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(result.headers.get('Content-Security-Policy')).toBeNull();
    expect(result.headers.get('Content-Security-Policy-Report-Only')).toBeNull();
  });

  it('retains enforced but omits explicitly empty report-only for custom host', async () => {
    mockEnv.CSP_ENFORCED = "frame-ancestors 'self' https://login.example.com";
    mockEnv.CSP_REPORT_ONLY = '';

    const response = htmlResponse();
    const event = mockEvent('https://login.example.com/login?realm=/', 'login.example.com');

    const result = await handle({ event, resolve: mockResolve(response) });

    expect(result.headers.get('Cache-Control')).toBe('no-cache, no-store');
    expect(result.headers.get('Edge-Control')).toBe('no-store');
    expect(result.headers.get('Content-Security-Policy')).toBe(
      "frame-ancestors 'self' https://login.example.com",
    );
    expect(result.headers.get('Content-Security-Policy-Report-Only')).toBeNull();
  });

  it('returns SAME response without header mutation for non-HTML', async () => {
    mockEnv.CSP_ENFORCED = "frame-ancestors 'self' https://alpha.example.com";
    mockEnv.CSP_REPORT_ONLY = "default-src 'self'; report-uri https://reports.example.com";

    const response = new Response('{}', {
      headers: { 'content-type': 'application/json' },
    });
    const event = mockEvent('https://openam.example.com/login?realm=/', 'openam.example.com');

    const result = await handle({ event, resolve: mockResolve(response) });

    expect(result).toBe(response);
    expect(result.headers.get('Cache-Control')).toBeNull();
    expect(result.headers.get('Edge-Control')).toBeNull();
    expect(result.headers.get('Pragma')).toBeNull();
    expect(result.headers.get('Referrer-Policy')).toBeNull();
    expect(result.headers.get('X-Content-Type-Options')).toBeNull();
    expect(result.headers.get('Content-Security-Policy')).toBeNull();
    expect(result.headers.get('Content-Security-Policy-Report-Only')).toBeNull();
  });

  it('records an app request but bypasses the registry for /api/health probes', async () => {
    const before = await requestCount();

    await handle({
      event: mockEvent('https://openam.example.com/api/authenticate'),
      resolve: mockResolve(htmlResponse()),
    });
    expect(await requestCount()).toBe(before + 1);

    await handle({
      event: mockEvent('https://openam.example.com/api/health/ready'),
      resolve: mockResolve(htmlResponse()),
    });
    expect(await requestCount()).toBe(before + 1);
  });

  it('records a thrown handler as a 500-class request', async () => {
    const before = await requestCount();

    await expect(
      handle({
        event: mockEvent('https://openam.example.com/api/authenticate'),
        resolve: (() => Promise.reject(new Error('boom'))) as unknown as Parameters<
          typeof handle
        >[0]['resolve'],
      }),
    ).rejects.toThrow('boom');
    expect(await requestCount()).toBe(before + 1);
    expect(await renderMetrics()).toContain(
      'login_app_requests_total{route="/api/authenticate",method="GET",code="500"} 1',
    );
  });
});
