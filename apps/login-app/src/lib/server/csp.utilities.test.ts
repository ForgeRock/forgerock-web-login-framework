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
});
