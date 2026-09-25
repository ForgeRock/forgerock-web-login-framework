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
 * Runs against a dedicated preview server (the `custom-component-error` Playwright project) with
 * FR_* env set (core/constants.ts throws at module-import time without them) and
 * PUBLIC_CUSTOM_HEADER_NAME pointed at "GhostName" — a name that passes through
 * selectRegistryEntry's module-init lookup at +page.svelte but matches no registered
 * custom header component. FR_* must stay set: core/constants.ts throws at module-import
 * time if any of those are missing, which crashes before the custom-component throw can
 * render +error.svelte. The registry has entries (the git-tracked demo components), so the
 * unknown name is what triggers the throw.
 *
 * SvelteKit's default prod handleError replaces the raw Error.message with "Internal Error"
 * on the rendered page, so the assertion here is the 500 + error-page shape; which env var
 * and name triggered it is proven by the server log carrying the full selectRegistryEntry
 * message and by unit tests. Isolated so the throwing env doesn't affect the shared
 * webServer used by every other test in the suite.
 */
test('Unknown custom header name throws at page start and renders the 500 error page', async ({
  page,
}) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(500);
  await expect(page.getByRole('heading', { name: 'Configuration error' })).toBeVisible();
  await expect(page.getByText('Status: 500')).toBeVisible();
});
