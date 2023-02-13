import { expect, test } from '@playwright/test';

import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test('Modal widget with login', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  // Navigate to page without Widget instantiation
  await navigate('widget');

  const loginLink = page.getByRole('link', { name: 'Login via Modal Widget' });

  await expect(loginLink).toBeVisible();

  await navigate('widget/modal?journey=TEST_Login');

  await expect(page.getByRole('dialog')).toBeHidden();

  await clickButton('Open Login Modal', '/authenticate');

  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByLabel('Username').fill('demouser');
  await page.getByLabel('Password').fill('j56eKtae*1');

  await clickButton('Sign In', '/authenticate');

  await verifyUserInfo(page, expect);

  // Navigate to page without Widget instantiation
  await navigate('widget');

  // Refresh the page to clear out previous Widget references
  await page.reload({ waitUntil: 'networkidle' });

  // Test the config and user API without Widget references
  await verifyUserInfo(page, expect);
});
