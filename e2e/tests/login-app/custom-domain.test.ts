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
 * Runs against the `custom-domain` project (port 4200), whose preview proxy
 * presents Host: id.petrov.ca — an alpha realm alias. AM's serverinfo answers
 * `/alpha`, driving the realm-less wellknown branch (IAM-12293).
 */

test('custom-domain arrival serves serverinfo with the alias realm', async ({ request }) => {
  const response = await request.get('/am/json/serverinfo/*');

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.realm).toBe('/alpha');
});

test('login succeeds through the alias-match (realm-less wellknown) branch', async ({ page }) => {
  await page.goto('/?goto=https://forgerock.github.io/');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page).toHaveURL('https://forgerock.github.io/');
});
