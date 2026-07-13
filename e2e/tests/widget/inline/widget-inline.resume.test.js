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
 * Inline-widget resume-from-URL. When the inline harness mounts with a suspendedId (as an
 * email magic link would land the user), it auto-calls journey.resume(location.href).
 * journey-client 2.1 parses the legacy resume params itself; the store only forwards a
 * `journey` query param. This drives that resume path on the inline widget.
 */
test('Inline widget resumes a suspended journey from the URL', async ({ page }) => {
  const suspendedId = 'inline-resume-e2e-suspended-id';

  // Intercept the resume request and return a completed login so the flow terminates.
  let resumeUrlSeen = null;
  await page.route('*/**/authenticate?*', async (route, request) => {
    if (request.url().includes(`suspendedId=${suspendedId}`)) {
      resumeUrlSeen = request.url();
      await route.fulfill({
        json: {
          tokenId: 'inline-resume-success-token',
          successUrl: '/openam/console',
          realm: '/alpha',
        },
      });
      return;
    }
    await route.continue();
  });

  // Inline auto-starts resume on mount when a suspendedId is present — no button to click.
  await Promise.all([
    page.waitForResponse((response) => response.url().includes(`suspendedId=${suspendedId}`)),
    page.goto(`widget/inline?journey=TEST_Login&suspendedId=${suspendedId}`, { waitFor: 'load' }),
  ]);

  // The resume request fired against the suspended URL, exercising the resume() path.
  expect(resumeUrlSeen).toContain(`suspendedId=${suspendedId}`);
});
