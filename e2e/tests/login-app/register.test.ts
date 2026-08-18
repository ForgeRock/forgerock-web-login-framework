/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';
import { v4 as uuid } from 'uuid';

/**
 * /register is login-app's own delta over the widget's registration form: it hardcodes
 * the `Registration` journey (no ?journey= param needed) and navigates to `/` on success.
 * The form itself is already fully driven by widget-inline.register.test.js / widget-modal
 * register tests against the same TEST_Registration journey, so this only asserts the
 * login-app-specific wiring.
 */
test('/register starts the Registration journey and redirects to / on success', async ({
  page,
}) => {
  const userName = uuid();

  await page.goto('/register');

  await page.getByLabel('Username').fill(userName);
  await page.getByLabel('First Name').fill('Demo');
  await page.getByLabel('Last Name').fill('User');
  await page.getByLabel('Email Address').fill('test@auto.com');
  await page.getByLabel('Password').fill('j56eKtae*1');

  await page
    .getByLabel('Select a security question')
    .first()
    .selectOption({ label: `What's your favorite color?` });
  await page.getByLabel('Security Answer').first().fill('Red');

  await page
    .getByLabel('Select a security question')
    .last()
    .selectOption({ label: 'Who was your first employer?' });
  await page.getByLabel('Security Answer').last().fill('Not Red');

  await page.getByText('Please accept our Terms & Conditions').click();

  await page.getByRole('button', { name: 'Next' }).click();

  // registration is successful if user is redirected to the end user UI after registration
  await page.waitForURL((url) => url.pathname === '/', { waitUntil: 'commit' });
  await expect(page).toHaveURL('https://openam-sdks.forgeblocks.com/enduser/?realm=/alpha#/');
});
