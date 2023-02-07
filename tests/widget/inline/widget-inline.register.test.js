import { expect, test } from '@playwright/test';
import { v4 as uuid } from 'uuid';

import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test('Inline widget with user registration', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  await navigate('widget/inline?journey=TEST_Registration');

  await page.getByLabel('Username').fill(uuid());
  await page.getByLabel('First Name').fill('Demo');
  await page.getByLabel('Last Name').fill('User');
  await page.getByLabel('Email Address').fill('test@auto.com');

  // Intentionally entire password that fails validation
  await page.getByLabel('Password').fill('willfail');

  await page
    .getByLabel('Select a security question')
    .selectOption({ label: `What's your favorite color?` });
  await page.getByLabel('Security Answer').fill('Red');
  // `getByLabel()` does not work, likely due to the `<span>` elements (?)
  await page.getByText('Please accept our Terms & Conditions').click();

  await clickButton('Register', '/authenticate');

  await expect(page.getByText('Password requirements')).toBeVisible();
  await expect(page.getByText('At least 1 number(s)')).toBeVisible();
  await expect(page.getByText('At least 1 uppercase')).toBeVisible();
  await expect(page.getByText('At least 1 lowercase')).toBeVisible();
  await expect(page.getByText('At least 1 symbol(s)')).toBeVisible();

  // Enter valid password
  await page.getByLabel('Password').fill('j56eKtae*1');

  await clickButton('Register', '/authenticate');

  await verifyUserInfo(page, expect, 'register');
});
