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
// Skipped unless LOGIN2_SMOKE_FQDN is set, so the CI and local suites never
// hit a live tenant.

import { type APIRequestContext, expect, test } from '@playwright/test';

const FQDN = process.env.LOGIN2_SMOKE_FQDN;
const CUSTOM_HOST = process.env.LOGIN2_SMOKE_CUSTOM_HOST ?? 'login.customer-example.com';

test.skip(!FQDN, 'set LOGIN2_SMOKE_FQDN to run against the live tenant');

// The SSR login page embeds the AM discovery URL it resolved for the request:
// wellknown:"https://<host>/am/oauth2/realms/root/realms/alpha/.well-known/openid-configuration".
async function wellknownHost(
  request: APIRequestContext,
  headers?: Record<string, string>,
): Promise<string> {
  const res = await request.get(`https://${FQDN}/login/?realm=/alpha`, { headers });
  expect(res.status(), 'SSR login page status').toBe(200);
  const match = (await res.text()).match(/wellknown:"([^"]*)"/);
  expect(match, 'SSR page embeds a wellknown URL').not.toBeNull();
  return new URL(match![1]).host;
}

test.describe('Login2 custom-domain smoke', () => {
  test('baseline discovery URL uses the tenant FQDN', async ({ request }) => {
    expect(await wellknownHost(request)).toBe(FQDN);
  });

  test('discovery URL follows the request Host header', async ({ request }) => {
    expect(await wellknownHost(request, { Host: CUSTOM_HOST })).toBe(CUSTOM_HOST);
  });
});
