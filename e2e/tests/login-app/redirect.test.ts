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

test('Successful redirect', async ({ page }) => {
  await page.goto('/?goto=https://forgerock.github.io/');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page).toHaveURL('https://forgerock.github.io/');
});

test('Invalid domain redirects to end user UI', async ({ page }) => {
  await page.goto('/?goto=https://invalidurl.com');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Next' }).click();

  // https://invalidurl.com does not exist in validation service
  // so it should redirect to end user UI
  await expect(page).toHaveURL('https://openam-sdks.forgeblocks.com/enduser/?realm=/alpha#/');
});

test('Empty URL redirects to fallback', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Next' }).click();

  // With no goto, AM falls back to its default success URL (end user UI).
  await expect(page).toHaveURL('https://openam-sdks.forgeblocks.com/enduser/?realm=/alpha#/');
});
