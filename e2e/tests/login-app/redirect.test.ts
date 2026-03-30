/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { test, expect } from '@playwright/test';
import { username, password } from '../utilities/demo-user.js';

test('Successful redirect', async ({ page }) => {
  await page.goto('/?goto=https://forgerock.github.io/');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page).toHaveURL('https://forgerock.github.io/');
});

test('Successful redirect with normalized https', async ({ page }) => {
  await page.goto('/?goto=forgerock.github.io/');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Next' }).click();

  // https:// protocol is automatically added to the
  // forgerock.github.io domain by normalizeRedirectParam function
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

test('Invalid protocol redirects to end user UI', async ({ page }) => {
  await page.goto('/?goto=javascript://forgerock.github.io/');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Next' }).click();

  // normalizeRedirectParam function normalizes the pseudo protocol to https://javascript://forgerock.github.io
  // Since the normalized URL does not exist in validation service it should redirect to end user UI
  await expect(page).toHaveURL('https://openam-sdks.forgeblocks.com/enduser/?realm=/alpha#/');
});
