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
import { handle } from './hooks.server';

function mockEvent(url: string, host?: string) {
  return {
    url: new URL(url),
    request: {
      headers: new Headers(host ? { host } : {}),
    },
  } as unknown as Parameters<typeof handle>[0]['event'];
}

function mockResolve(response: Response) {
  return (async () => response) as unknown as Parameters<typeof handle>[0]['resolve'];
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
});
