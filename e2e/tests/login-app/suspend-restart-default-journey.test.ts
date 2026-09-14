/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';

/**
 * IAM-12006 (default-journey fallback layer): a fresh device with a bare suspendedId
 * link (no journey/authIndexValue in the URL, no storage — AM's documented magic-link
 * shape) has no journey identity anywhere. The restart after the failed resume must
 * use the host-configured default journey (FR_AM_JOURNEY_LOGIN), never start(undefined).
 *
 * This runs on the dedicated port-5829 server whose FR_AM_JOURNEY_LOGIN is pinned to
 * TEST_ThemeE2E — a NON-default journey, so the realm default (Login) can't satisfy
 * the assertion by coincidence.
 *
 * Same distinguishing trick as the other suspend-restart tests: decode authIndexValue
 * out of the restarted call's authId JWT.
 */
test('bare suspendedId restart on a fresh device uses the configured default journey', async ({
  page,
}) => {
  const configuredDefault = 'TEST_ThemeE2E';

  const authIndexValues: string[] = [];
  await page.route(
    (url) => url.pathname.endsWith('/authenticate'),
    async (route) => {
      // Fetch once and fulfill with that response — a second network hit would
      // double-submit the authenticate call to AM.
      const response = await route.fetch();
      const body = await response.json();
      if (body.authId) {
        // AM's authId is a JWT; its payload is base64url, which atob needs
        // normalized back to standard base64 with padding.
        const payloadSegment = body.authId.split('.')[1];
        const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(
          atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')),
        );
        authIndexValues.push(payload.authIndexValue ?? '(no authIndexValue)');
      }
      await route.fulfill({ response });
    },
  );

  await page.goto(`/?suspendedId=e2e-fresh-device-suspended-id`);

  await expect.poll(() => authIndexValues, { timeout: 45_000 }).toContain(configuredDefault);
  await expect(page.getByLabel('Username')).toBeVisible();
});
