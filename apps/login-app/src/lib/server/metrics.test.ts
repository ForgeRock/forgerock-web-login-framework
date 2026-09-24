/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import {
  amEndpointLabel,
  recordAmRequest,
  recordAppRequest,
  recordRedirectValidation,
  recordThemeFetch,
  registryReset,
  renderMetrics,
  routeLabel,
  statusCodeClass,
} from './metrics';

describe('statusCodeClass', () => {
  it('maps status codes to their bounded class', () => {
    expect(statusCodeClass(200)).toBe('2xx');
    expect(statusCodeClass(302)).toBe('3xx');
    expect(statusCodeClass(401)).toBe('4xx');
    expect(statusCodeClass(503)).toBe('5xx');
  });

  it('maps a missing status (network failure) to error', () => {
    expect(statusCodeClass(undefined)).toBe('error');
  });
});

describe('routeLabel', () => {
  it('keeps API route paths verbatim', () => {
    expect(
      routeLabel({ url: new URL('https://t.example/api/authenticate'), route: undefined }),
    ).toBe('/api/authenticate');
  });

  it('collapses page routes to the SvelteKit route id, not the raw URL', () => {
    expect(
      routeLabel({
        url: new URL('https://t.example/some/page?goto=https://evil.example'),
        route: { id: '/(app)/some/[tree]' },
      }),
    ).toBe('/(app)/some/[tree]');
  });

  it('falls back to other when no route id exists', () => {
    expect(routeLabel({ url: new URL('https://t.example/favicon.ico'), route: undefined })).toBe(
      'other',
    );
  });
});

describe('amEndpointLabel', () => {
  it('collapses realm paths to the endpoint name', () => {
    expect(amEndpointLabel('/am/json/realms/root/realms/alpha/authenticate')).toBe('authenticate');
    expect(amEndpointLabel('/am/oauth2/realms/root/realms/alpha/connect/endSession')).toBe(
      'endSession',
    );
    expect(amEndpointLabel('/am/oauth2/alpha/authorize')).toBe('authorize');
    expect(amEndpointLabel('/am/json/realms/root/sessions?_action=validate'.split('?')[0])).toBe(
      'sessions',
    );
  });

  it('labels unrecognized AM paths as other', () => {
    expect(amEndpointLabel('/am/global-logout')).toBe('other');
  });
});

describe('recorded series render in exposition format', () => {
  beforeEach(() => {
    recordAppRequest('/api/authenticate', 'POST', 200, 0.01);
    recordAmRequest('authenticate', 200, 0.05);
    recordAmRequest('sessions', undefined, 2.5);
    recordThemeFetch('success', 0.1);
    recordThemeFetch('cache', 0.4);
    recordRedirectValidation('accepted');
    recordRedirectValidation('rejected');
  });

  afterAll(async () => {
    // Other suites import this module too; reset counters so their
    // expectations are not polluted by this file's series.
    registryReset();
  });

  it('renders the login_app_ series with label sets intact', async () => {
    const body = await renderMetrics();

    expect(body).toContain(
      'login_app_requests_total{route="/api/authenticate",method="POST",code="200"}',
    );
    expect(body).toContain('login_app_am_requests_total{endpoint="authenticate",code="2xx"}');
    expect(body).toContain('login_app_am_requests_total{endpoint="sessions",code="error"}');
    expect(body).toContain('login_app_theme_fetches_total{outcome="success"}');
    expect(body).toContain('login_app_theme_fetches_total{outcome="cache"}');
    expect(body).toContain('login_app_redirect_validations_total{outcome="accepted"}');
    expect(body).toContain('login_app_redirect_validations_total{outcome="rejected"}');
    expect(body).toContain('login_app_up 1');
  });

  it('never emits unbounded labels: no sub or per-identity label names', async () => {
    const body = await renderMetrics();

    expect(body).not.toMatch(/\bsub="/);
    expect(body).not.toMatch(/tokenId="|userId="|uid="/);
  });
});
