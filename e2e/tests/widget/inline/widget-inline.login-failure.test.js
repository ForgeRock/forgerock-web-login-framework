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
 * Inline-widget coverage for the login-failure path. The failure logic lives in the
 * shared journey store, but the inline presentation renders the form differently from
 * the modal, so this guards inline-specific rendering of the failure state under
 * journey-client 2.1's LoginFailure result.
 */
test('Inline widget surfaces a login failure and keeps the form usable', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  const messageArray = [];
  page.on('console', (msg) => messageArray.push(msg.text()));

  await navigate('widget/inline?journey=TEST_Login');

  // Inline auto-renders the form on mount — submit invalid credentials straight away.
  await page.getByRole('textbox', { name: 'Username' }).fill('notauser');
  await page.getByRole('textbox', { name: 'Password' }).fill('notapassword');

  await clickButton('Sign In', '/authenticate');

  // Failure message renders...
  await expect(page.getByText('Sign in failed')).toBeVisible();

  // ...the journey onFailure() event fires...
  expect(messageArray.includes('Login failure event fired')).toBe(true);

  // ...and the form restarts usable (not a dead end).
  await expect(page.getByRole('textbox', { name: 'Username' })).toBeEditable();
  await expect(page.getByRole('textbox', { name: 'Password' })).toBeEditable();
});
