/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';

import { asyncEvents } from '../../utilities/async-events.js';

/**
 * Dedicated coverage for the login-failure path. journey-client 2.1 returns a
 * `LoginFailure` result (instead of a generic error) for AM authentication
 * failures, which the widget surfaces via the LoginFailure branch of
 * handleJourneyResult. This test isolates that flow: bad credentials must show
 * the failure message, fire the failure event, and leave the journey usable.
 */
test('Modal widget surfaces a login failure and keeps the journey usable', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  const messageArray = [];
  page.on('console', (msg) => messageArray.push(msg.text()));

  await navigate('widget/modal?journey=TEST_Login');

  await expect(page.getByRole('dialog')).toBeHidden();

  await clickButton('Open Login Modal', '/authenticate');

  await expect(page.getByRole('dialog')).toBeVisible();

  // Submit invalid credentials — AM responds 4xx and journey-client returns a LoginFailure.
  await page.getByLabel('Username').fill('notauser');
  await page.getByLabel('Password').fill('notapassword');

  await clickButton('Sign In', '/authenticate');

  // Failure message renders...
  await expect(page.getByText('Sign in failed')).toBeVisible();

  // ...the journey onFailure() event fires...
  expect(messageArray.includes('Login failure event fired')).toBe(true);

  // ...and the journey restarts with a fresh, usable form (not a dead end).
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Username')).toBeEditable();
  await expect(page.getByLabel('Password')).toBeEditable();
});
