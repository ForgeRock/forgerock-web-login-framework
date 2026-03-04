/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';
import { asyncEvents } from '../../utilities/async-events.js';

// Skipped: PingProtect journeys removed from AM server
test.skip('Widget calls PingProtect via callback', async ({ page }) => {
  const messageArray: string[] = [];
  // Listen for events on page
  page.on('console', async (msg) => {
    return messageArray.push(msg.text());
  });
  const { navigate } = asyncEvents(page);

  await navigate('widget/modal?journey=TEST_LoginPingProtect');
  await page.getByRole('button', { name: 'Open Login Modal' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Username')).toBeVisible();

  expect(messageArray.includes('[SignalsSDK] Starting Signals SDK...')).toBe(true);
  expect(messageArray.includes('[SignalsSDK] Add tag: SDK started')).toBe(true);
  expect(
    messageArray.includes(
      '[SignalsSDK] Add tag: location:https://localhost:3000/e2e/widget/modal?journey=TEST_LoginPingProtect',
    ),
  ).toBe(true);

  await page.getByLabel('Username').click();
  await page.getByLabel('Username').fill('jlowery');
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByText('Risk')).toBeVisible();

  await page.getByRole('button', { name: 'Yes' }).click();

  await expect(page.getByText('Full name:')).toBeVisible();

  await page.getByRole('button', { name: 'Close' });
});
// Skipped: PingProtect journeys removed from AM server
test.skip('Widget calls PingProtect via startup with no callback', async ({ page }) => {
  const messageArray: string[] = [];
  // Listen for events on page
  page.on('console', async (msg) => {
    return messageArray.push(msg.text());
  });
  const { navigate } = asyncEvents(page);

  await navigate(
    'widget/modal?journey=TEST_LoginPingProtectNoCallback&initializePingProtectEarly=02fb4743-189a-4bc7-9d6c-a919edfe6447',
  );
  await page.getByRole('button', { name: 'Open Login Modal' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Username')).toBeVisible();

  expect(
    messageArray.filter((string) => string.includes('[SignalsSDK] Token Ready: ')).length,
  ).toBeGreaterThanOrEqual(1);
  expect(messageArray.includes('[SignalsSDK] Add tag: SDK started')).toBe(true);
  expect(
    messageArray.includes(
      '[SignalsSDK] Add tag: location:https://localhost:3000/e2e/widget/modal?journey=TEST_LoginPingProtectNoCallback&initializePingProtectEarly=02fb4743-189a-4bc7-9d6c-a919edfe6447',
    ),
  ).toBe(true);
  expect(messageArray.includes('[SignalsSDK] Add tag: SDK paused behaviorally')).toBe(true);
  expect(messageArray.includes('[SignalsSDK] Add tag: SDK resumed behaviorally')).toBe(true);

  await page.getByPlaceholder(' ').click();
  await page.getByPlaceholder(' ').fill('sdkuser');
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByText('Risk')).toBeVisible();

  await page.getByRole('button', { name: 'Yes' }).click();

  const response = await page.waitForResponse(/access_token/);
  expect(response.status()).toBe(200);
  await expect(page.getByText('Full name:')).toBeVisible();

  await page.getByRole('button', { name: 'Close' });
});
