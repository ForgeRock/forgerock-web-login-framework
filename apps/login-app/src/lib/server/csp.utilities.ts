/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { resolveRequestedRealm } from './redirect/redirect.utilities';

type CspEnvironment = {
  enforced?: string;
  reportOnly?: string;
};

type CspRequestContext = {
  amUrl?: string;
  currentHost?: string | null;
  configuredRealm?: string;
};

export const DEFAULT_CSP_ENFORCED = "frame-ancestors 'self'";
export const DEFAULT_CSP_REPORT_ONLY =
  "frame-ancestors 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'";

const CUSTOMER_CSP_REALMS = new Set(['alpha', 'bravo']);

function hostWithoutPort(host: string): string {
  return host.toLowerCase().replace(/:\d+$/, '');
}

function getAMHost(amUrl?: string): string | null {
  if (!amUrl) {
    return null;
  }

  try {
    return new URL(amUrl).host;
  } catch {
    return null;
  }
}

function isCustomHost(context: CspRequestContext): boolean {
  const amHost = getAMHost(context.amUrl);

  if (!context.currentHost || !amHost) {
    return false;
  }

  return hostWithoutPort(context.currentHost) !== hostWithoutPort(amHost);
}

export function buildLoginCspHeaders(
  url: URL,
  cspEnvironment: CspEnvironment,
  context: CspRequestContext = {},
): Headers {
  const realm = resolveRequestedRealm(url, context.configuredRealm);
  const headers = new Headers();

  if (CUSTOMER_CSP_REALMS.has(realm) || isCustomHost(context)) {
    if (cspEnvironment.enforced !== '') {
      headers.set('Content-Security-Policy', cspEnvironment.enforced ?? DEFAULT_CSP_ENFORCED);
    }

    if (cspEnvironment.reportOnly !== '') {
      headers.set(
        'Content-Security-Policy-Report-Only',
        cspEnvironment.reportOnly ?? DEFAULT_CSP_REPORT_ONLY,
      );
    }

    return headers;
  }

  headers.set('Content-Security-Policy', DEFAULT_CSP_ENFORCED);
  headers.set('Content-Security-Policy-Report-Only', DEFAULT_CSP_REPORT_ONLY);

  return headers;
}

export function isHtmlResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type') || '';

  return contentType.includes('text/html');
}
