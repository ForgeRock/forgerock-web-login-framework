import { describe, expect, it } from 'vitest';

import {
  buildLoginCspHeaders,
  DEFAULT_CSP_ENFORCED,
  DEFAULT_CSP_REPORT_ONLY,
  getRealmFromLoginUrl,
  isHtmlResponse,
} from './csp.utilities';

describe('Login CSP utilities', () => {
  it('uses root as the default realm', () => {
    const realm = getRealmFromLoginUrl(new URL('https://example.com/login'));

    expect(realm).toBe('root');
  });

  it('uses customer CSP values only for alpha and bravo realm requests', () => {
    const alphaHeaders = buildLoginCspHeaders(new URL('https://example.com/login?realm=/alpha'), {
      enforced: "frame-ancestors 'self' https://alpha.example.com",
      reportOnly: "default-src 'self'; report-uri https://reports.example.com",
    });
    const rootHeaders = buildLoginCspHeaders(new URL('https://example.com/login?realm=/'), {
      enforced: "frame-ancestors 'self' https://alpha.example.com",
      reportOnly: "default-src 'self'; report-uri https://reports.example.com",
    });

    expect(alphaHeaders.get('Content-Security-Policy')).toBe(
      "frame-ancestors 'self' https://alpha.example.com",
    );
    expect(alphaHeaders.get('Content-Security-Policy-Report-Only')).toBe(
      "default-src 'self'; report-uri https://reports.example.com",
    );
    expect(rootHeaders.get('Content-Security-Policy')).toBe(DEFAULT_CSP_ENFORCED);
    expect(rootHeaders.get('Content-Security-Policy-Report-Only')).toBe(DEFAULT_CSP_REPORT_ONLY);
  });

  it('uses customer CSP values for custom hosts', () => {
    const headers = buildLoginCspHeaders(
      new URL('https://login.example.com/login?realm=/'),
      {
        enforced: "frame-ancestors 'self' https://custom.example.com",
        reportOnly: "default-src 'self'; report-uri https://reports.example.com",
      },
      {
        amUrl: 'https://openam.example.com/am',
        currentHost: 'login.example.com',
      },
    );

    expect(headers.get('Content-Security-Policy')).toBe(
      "frame-ancestors 'self' https://custom.example.com",
    );
    expect(headers.get('Content-Security-Policy-Report-Only')).toBe(
      "default-src 'self'; report-uri https://reports.example.com",
    );
  });

  it('uses default CSP values for the AM host root realm', () => {
    const headers = buildLoginCspHeaders(
      new URL('https://openam.example.com/login?realm=/'),
      {
        enforced: "frame-ancestors 'self' https://custom.example.com",
        reportOnly: "default-src 'self'; report-uri https://reports.example.com",
      },
      {
        amUrl: 'https://openam.example.com/am',
        currentHost: 'openam.example.com:443',
      },
    );

    expect(headers.get('Content-Security-Policy')).toBe(DEFAULT_CSP_ENFORCED);
    expect(headers.get('Content-Security-Policy-Report-Only')).toBe(DEFAULT_CSP_REPORT_ONLY);
  });

  it('detects HTML responses', () => {
    const response = new Response('<main></main>', {
      headers: {
        'content-type': 'text/html; charset=utf-8',
      },
    });

    expect(isHtmlResponse(response)).toBe(true);
  });

  it('omits enforced header when customer enforced policy is explicitly empty but retains report-only', () => {
    const headers = buildLoginCspHeaders(new URL('https://example.com/login?realm=/alpha'), {
      enforced: '',
      reportOnly: "default-src 'self'; report-uri https://reports.example.com",
    });

    expect(headers.get('Content-Security-Policy')).toBeNull();
    expect(headers.get('Content-Security-Policy-Report-Only')).toBe(
      "default-src 'self'; report-uri https://reports.example.com",
    );
  });

  it('omits report-only header when customer report-only policy is explicitly empty but retains enforced', () => {
    const headers = buildLoginCspHeaders(new URL('https://example.com/login?realm=/alpha'), {
      enforced: "frame-ancestors 'self' https://alpha.example.com",
      reportOnly: '',
    });

    expect(headers.get('Content-Security-Policy')).toBe(
      "frame-ancestors 'self' https://alpha.example.com",
    );
    expect(headers.get('Content-Security-Policy-Report-Only')).toBeNull();
  });

  it('omits both headers when customer disables both policies with empty strings', () => {
    const headers = buildLoginCspHeaders(new URL('https://example.com/login?realm=/alpha'), {
      enforced: '',
      reportOnly: '',
    });

    expect(headers.get('Content-Security-Policy')).toBeNull();
    expect(headers.get('Content-Security-Policy-Report-Only')).toBeNull();
  });

  it('uses defaults for admin root realm even when environment policies are empty strings', () => {
    const headers = buildLoginCspHeaders(
      new URL('https://openam.example.com/login?realm=/'),
      {
        enforced: '',
        reportOnly: '',
      },
      {
        amUrl: 'https://openam.example.com/am',
        currentHost: 'openam.example.com:443',
      },
    );

    expect(headers.get('Content-Security-Policy')).toBe(DEFAULT_CSP_ENFORCED);
    expect(headers.get('Content-Security-Policy-Report-Only')).toBe(DEFAULT_CSP_REPORT_ONLY);
  });

  it('omits headers for custom host when policies are explicitly empty', () => {
    const headers = buildLoginCspHeaders(
      new URL('https://login.example.com/login?realm=/'),
      {
        enforced: '',
        reportOnly: '',
      },
      {
        amUrl: 'https://openam.example.com/am',
        currentHost: 'login.example.com',
      },
    );

    expect(headers.get('Content-Security-Policy')).toBeNull();
    expect(headers.get('Content-Security-Policy-Report-Only')).toBeNull();
  });

  it.each([
    {
      label: 'omits enforced only',
      env: {
        enforced: '',
        reportOnly: "default-src 'self'; report-uri https://reports.example.com",
      },
      expectedEnforced: null,
      expectedReportOnly: "default-src 'self'; report-uri https://reports.example.com",
    },
    {
      label: 'omits report-only only',
      env: {
        enforced: "frame-ancestors 'self' https://bravo.example.com",
        reportOnly: '',
      },
      expectedEnforced: "frame-ancestors 'self' https://bravo.example.com",
      expectedReportOnly: null,
    },
    {
      label: 'omits both',
      env: { enforced: '', reportOnly: '' },
      expectedEnforced: null,
      expectedReportOnly: null,
    },
  ])('bravo realm $label with explicit empty', ({ env, expectedEnforced, expectedReportOnly }) => {
    const headers = buildLoginCspHeaders(new URL('https://example.com/login?realm=/bravo'), env);

    expect(headers.get('Content-Security-Policy')).toBe(expectedEnforced);
    expect(headers.get('Content-Security-Policy-Report-Only')).toBe(expectedReportOnly);
  });

  it.each([
    {
      label: 'omits enforced only',
      env: {
        enforced: '',
        reportOnly: "default-src 'self'; report-uri https://reports.example.com",
      },
      expectedEnforced: null,
      expectedReportOnly: "default-src 'self'; report-uri https://reports.example.com",
    },
    {
      label: 'omits report-only only',
      env: {
        enforced: "frame-ancestors 'self' https://custom.example.com",
        reportOnly: '',
      },
      expectedEnforced: "frame-ancestors 'self' https://custom.example.com",
      expectedReportOnly: null,
    },
  ])('custom host $label with explicit empty', ({ env, expectedEnforced, expectedReportOnly }) => {
    const headers = buildLoginCspHeaders(new URL('https://login.example.com/login?realm=/'), env, {
      amUrl: 'https://openam.example.com/am',
      currentHost: 'login.example.com',
    });

    expect(headers.get('Content-Security-Policy')).toBe(expectedEnforced);
    expect(headers.get('Content-Security-Policy-Report-Only')).toBe(expectedReportOnly);
  });

  it.each([
    {
      label: 'alpha both missing',
      url: 'https://example.com/login?realm=/alpha',
      context: {},
      env: {},
    },
    {
      label: 'alpha both undefined',
      url: 'https://example.com/login?realm=/alpha',
      context: {},
      env: { enforced: undefined, reportOnly: undefined },
    },
    {
      label: 'bravo both missing',
      url: 'https://example.com/login?realm=/bravo',
      context: {},
      env: {},
    },
    {
      label: 'bravo both undefined',
      url: 'https://example.com/login?realm=/bravo',
      context: {},
      env: { enforced: undefined, reportOnly: undefined },
    },
    {
      label: 'custom-host both missing',
      url: 'https://login.example.com/login?realm=/',
      context: {
        amUrl: 'https://openam.example.com/am',
        currentHost: 'login.example.com',
      },
      env: {},
    },
    {
      label: 'custom-host both undefined',
      url: 'https://login.example.com/login?realm=/',
      context: {
        amUrl: 'https://openam.example.com/am',
        currentHost: 'login.example.com',
      },
      env: { enforced: undefined, reportOnly: undefined },
    },
  ])('retains defaults for $label', ({ url, context, env }) => {
    const headers = buildLoginCspHeaders(new URL(url), env, context);

    expect(headers.get('Content-Security-Policy')).toBe(DEFAULT_CSP_ENFORCED);
    expect(headers.get('Content-Security-Policy-Report-Only')).toBe(DEFAULT_CSP_REPORT_ONLY);
  });

  it.each([
    {
      label: 'alpha enforced missing retains enforced default',
      url: 'https://example.com/login?realm=/alpha',
      context: {},
      env: {
        reportOnly: "default-src 'self'; report-uri https://reports.example.com",
      },
      expectedEnforced: DEFAULT_CSP_ENFORCED,
      expectedReportOnly: "default-src 'self'; report-uri https://reports.example.com",
    },
    {
      label: 'alpha report-only missing retains report-only default',
      url: 'https://example.com/login?realm=/alpha',
      context: {},
      env: {
        enforced: "frame-ancestors 'self' https://alpha.example.com",
      },
      expectedEnforced: "frame-ancestors 'self' https://alpha.example.com",
      expectedReportOnly: DEFAULT_CSP_REPORT_ONLY,
    },
    {
      label: 'bravo enforced missing retains enforced default',
      url: 'https://example.com/login?realm=/bravo',
      context: {},
      env: {
        reportOnly: "default-src 'self'; report-uri https://reports.example.com",
      },
      expectedEnforced: DEFAULT_CSP_ENFORCED,
      expectedReportOnly: "default-src 'self'; report-uri https://reports.example.com",
    },
    {
      label: 'bravo report-only missing retains report-only default',
      url: 'https://example.com/login?realm=/bravo',
      context: {},
      env: {
        enforced: "frame-ancestors 'self' https://bravo.example.com",
      },
      expectedEnforced: "frame-ancestors 'self' https://bravo.example.com",
      expectedReportOnly: DEFAULT_CSP_REPORT_ONLY,
    },
    {
      label: 'custom-host enforced missing retains enforced default',
      url: 'https://login.example.com/login?realm=/',
      context: {
        amUrl: 'https://openam.example.com/am',
        currentHost: 'login.example.com',
      },
      env: {
        reportOnly: "default-src 'self'; report-uri https://reports.example.com",
      },
      expectedEnforced: DEFAULT_CSP_ENFORCED,
      expectedReportOnly: "default-src 'self'; report-uri https://reports.example.com",
    },
    {
      label: 'custom-host report-only missing retains report-only default',
      url: 'https://login.example.com/login?realm=/',
      context: {
        amUrl: 'https://openam.example.com/am',
        currentHost: 'login.example.com',
      },
      env: {
        enforced: "frame-ancestors 'self' https://custom.example.com",
      },
      expectedEnforced: "frame-ancestors 'self' https://custom.example.com",
      expectedReportOnly: DEFAULT_CSP_REPORT_ONLY,
    },
  ])('$label', ({ url, context, env, expectedEnforced, expectedReportOnly }) => {
    const headers = buildLoginCspHeaders(new URL(url), env, context);

    expect(headers.get('Content-Security-Policy')).toBe(expectedEnforced);
    expect(headers.get('Content-Security-Policy-Report-Only')).toBe(expectedReportOnly);
  });

  it('uses defaults for admin root realm when policies are missing/undefined', () => {
    for (const env of [{}, { enforced: undefined, reportOnly: undefined }] as const) {
      const headers = buildLoginCspHeaders(
        new URL('https://openam.example.com/login?realm=/'),
        { ...env },
        {
          amUrl: 'https://openam.example.com/am',
          currentHost: 'openam.example.com:443',
        },
      );

      expect(headers.get('Content-Security-Policy')).toBe(DEFAULT_CSP_ENFORCED);
      expect(headers.get('Content-Security-Policy-Report-Only')).toBe(DEFAULT_CSP_REPORT_ONLY);
    }
  });
});
