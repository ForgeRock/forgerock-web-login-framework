/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';

import { password, username } from '../utilities/demo-user.js';

/**
 * Runs against the `custom-domain` project (port 4200): FR_AM_URL points at
 * the custom domain itself (https://id.petrov.ca/am). The vite proxy presents
 * Host: id.petrov.ca so AM answers every /am/* call as the alias realm /alpha
 * (IAM-12293).
 */

test('serverinfo answers the alias realm from the custom-domain FR_AM_URL', async ({ request }) => {
  const response = await request.get('/am/json/serverinfo/*');

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.realm).toBe('/alpha');
});

test('login succeeds with a custom-domain FR_AM_URL', async ({ page }) => {
  await page.goto('/?goto=https://forgerock.github.io/');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page).toHaveURL('https://forgerock.github.io/');
});

test('cross-realm request is rejected at arrival — a custom domain serves exactly one realm', async ({
  page,
}) => {
  const response = await page.goto('/?realm=bravo');

  expect(response?.status()).toBe(404);
  await expect(page.getByText("Realm 'bravo' is not available on this domain")).toBeVisible();
});
