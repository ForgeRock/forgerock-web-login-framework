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
 * Runs against a dedicated preview server (the `config-error` Playwright project) that is
 * started without FR_AM_URL/FR_REALM_PATH/FR_AM_WELLKNOWN_URL, so the +layout.server.ts
 * env guard throws a 500 and SvelteKit renders +error.svelte. Isolated so the missing env
 * doesn't affect the shared webServer used by every other test in the suite.
 */
test('Missing AM config renders the 500 config-error page', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(500);
  await expect(page.getByRole('heading', { name: 'Configuration error' })).toBeVisible();
  await expect(page.getByText('Status: 500')).toBeVisible();
  await expect(page.getByText(/FR_AM_URL/)).toBeVisible();
});
