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
 * Runs against a dedicated preview server (the `idm-theme` Playwright project) with
 * FR_IDM_URL pointed at the real test tenant's IDM instance and FR_AM_JOURNEY_LOGIN set to
 * TEST_ThemeE2E — a tree dedicated to this test, linked to its own dedicated TEST_ThemeE2E
 * theme, so the assertion below isn't coupled to whatever theme the production Login journey
 * has at any given time. fetchIdmTheme runs server-side in +layout.server.ts, so it can't be
 * intercepted with page.route — this proves the real SSR injection path: the tenant's
 * themerealm response -> ThemeObject -> (app)/+layout.svelte's `themeStyle` inline style
 * on `.theme-root`.
 */
test('IDM theme is injected into .theme-root as inline CSS vars on SSR', async ({ page }) => {
  await page.goto('/?journey=TEST_ThemeE2E');

  const themeRoot = page.locator('.theme-root');
  const style = await themeRoot.getAttribute('style');

  // TEST_ThemeE2E's theme: primaryColor #FD0000 -> hsl(0, 100%, 49.6%)
  expect(style).toContain('--tw-colors-primary-dark-hs:0, 100%');
  expect(style).toContain('--tw-colors-primary-dark-l:49.6%');
  expect(style).toContain(
    '--fr-page-bg-image:url("https://qa65.lplbusinesssolutions.com/content/dam/lpl-www/lplbusinesssolutions/images/GettyImages-996615754.jpg")',
  );
});
