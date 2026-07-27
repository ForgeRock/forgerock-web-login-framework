/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';

import { asyncEvents } from '../../utilities/async-events.js';

test('Widget calls PingProtect via callback', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', async (msg) => {
    logs.push(msg.text());
  });

  const { navigate } = asyncEvents(page);

  await navigate('widget/modal?journey=TEST_Protect');
  await page.getByRole('button', { name: 'Open Login Modal' }).click();

  await expect(page.getByRole('dialog')).toBeVisible();

  // PingOneProtectInitialize auto-submits a second /authenticate after start() completes.
  // Wait for both round-trips before the Page Node (username/password) is rendered.
  // PingOneProtectInitialize runs start() then auto-submits. Username only appears after
  // both the Signals SDK init and the second /authenticate round-trip complete.
  const usernameField = page.getByLabel('User Name').or(page.getByLabel('Username'));
  await expect(usernameField).toBeVisible();

  // Log is emitted synchronously inside the callback before self-submit fires
  expect(logs.includes('Protect initialized by callback for data collection')).toBe(true);

  await usernameField.fill('demouser');
  await page.getByLabel('Password').fill('j56eKtae*1');

  // After credentials, the journey hits PingOneProtectEvaluate which calls getData() then
  // auto-submits. Wait for that second /authenticate to complete before asserting the log.
  await Promise.all([
    page.waitForResponse((res) => res.url().includes('/authenticate') && res.status() === 200),
    page.getByRole('button', { name: 'Next' }).click(),
  ]);

  // The evaluation callback auto-submits a further /authenticate — wait for it to land
  await page.waitForResponse((res) => res.url().includes('/authenticate'));

  expect(logs.includes('Data set on Protect evaluation callback')).toBe(true);
});
