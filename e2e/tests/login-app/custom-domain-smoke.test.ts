/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

// Custom-domain smoke for the aic-login2 SSR page: the discovery URL it
// embeds must follow the request Host header, which is what a custom domain
// changes. Run against the live tenant with:
//   cd e2e && LOGIN2_SMOKE_FQDN=openam-aic-login2-51.forgeblocks.com \
//     npx playwright test custom-domain-smoke --config=playwright.live.config.ts
// Optionally set LOGIN2_SMOKE_CUSTOM_HOST (defaults to login.customer-example.com).
// Prerequisite: the tenant must have the aic-login2 feature enabled — with the
// feature off, /login/ serves the legacy app and embeds no wellknown URL, so
// the smoke fails at the "SSR page embeds a wellknown URL" assertion.
// Skipped unless LOGIN2_SMOKE_FQDN is set, so the CI and local suites never
// hit a live tenant.

import { type APIRequestContext, expect, test } from '@playwright/test';

const FQDN = process.env.LOGIN2_SMOKE_FQDN;
const CUSTOM_HOST = process.env.LOGIN2_SMOKE_CUSTOM_HOST ?? 'login.customer-example.com';

test.skip(!FQDN, 'set LOGIN2_SMOKE_FQDN to run against the live tenant');

// The SSR login page embeds the AM discovery URL it resolved for the request
// (realmPath=/alpha embeds .../realms/root/realms/alpha/.well-known/...; the
// root realm embeds .../realms/root/.well-known/...). Returns the URL's host.
async function wellknownHost(
  request: APIRequestContext,
  path: string,
  headers?: Record<string, string>,
): Promise<string> {
  const res = await request.get(`https://${FQDN}${path}`, { headers });
  expect(res.status(), `SSR login page status for ${path}`).toBe(200);
  const match = (await res.text()).match(/wellknown:"([^"]*)"/);
  expect(match, `SSR page embeds a wellknown URL for ${path}`).not.toBeNull();
  return new URL(match![1]).host;
}

test.describe('Login2 custom-domain smoke', () => {
  // /login/ (no realm param) serves the root realm — the shape a custom
  // domain serves; /login/?realm=/alpha is the sub-realm shape.
  for (const path of ['/login/', '/login/?realm=/alpha']) {
    test(`baseline discovery URL uses the tenant FQDN (${path})`, async ({ request }) => {
      expect(await wellknownHost(request, path)).toBe(FQDN);
    });

    test(`discovery URL follows the request Host header (${path})`, async ({ request }) => {
      expect(await wellknownHost(request, path, { Host: CUSTOM_HOST })).toBe(CUSTOM_HOST);
    });
  }
});
