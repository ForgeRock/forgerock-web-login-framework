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
  const { navigate } = asyncEvents(page);

  await navigate('widget/modal?journey=TEST_Protect');
  await page.getByRole('button', { name: 'Open Login Modal' }).click();

  await expect(page.getByRole('dialog')).toBeVisible();

  // PingOneProtectInitialize auto-submits after start() completes.
  // The username field only appears after start() succeeds and the next
  // /authenticate round-trip lands — proving initialize ran the success branch.
  const usernameField = page.getByLabel('User Name').or(page.getByLabel('Username'));
  await expect(usernameField).toBeVisible();

  await usernameField.fill('demouser');
  await page.getByLabel('Password').fill('j56eKtae*1');

  // Must be set up before clicking Next so it catches the request when evaluate auto-submits.
  const evaluateRequestPromise = page.waitForRequest(
    (req) =>
      req.method() === 'POST' &&
      req.url().includes('/authenticate') &&
      req.postDataJSON()?.callbacks?.[0]?.type === 'PingOneProtectEvaluationCallback',
  );

  await Promise.all([
    page.waitForResponse((res) => res.url().includes('/authenticate') && res.status() === 200),
    page.getByRole('button', { name: 'Next' }).click(),
  ]);

  await page.waitForResponse((res) => res.url().includes('/authenticate'));

  // IDToken1signals populated proves getData() succeeded and setData() was called —
  // the success branch in ping-protect-evaluation.svelte is the only path that sets this value.
  const evaluateRequest = await evaluateRequestPromise;
  const body = evaluateRequest.postDataJSON() as {
    callbacks: Array<{ input: Array<{ name: string; value: string }> }>;
  };
  expect(body.callbacks[0].input[0].value).toBeTruthy();
});
