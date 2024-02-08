import { expect, test } from '@playwright/test';
import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test('Modal widget with failed and successful login, keyboard only', async ({ page }) => {
  const { navigate, pressEnter, pressSpacebar } = asyncEvents(page);

  await navigate('widget/modal?journey=TEST_Login');

  // Tab to Open Login Modal button and press Enter
  await page.keyboard.press('Tab');
  await pressEnter('/authenticate');

  const username1 = page.getByLabel('Username');
  const password1 = page.getByLabel('Password');

  await expect(username1).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(username1).toBeFocused();
  await username1.fill('username01');

  await page.keyboard.press('Tab');
  await expect(password1).toBeFocused();
  await password1.fill('password');

  await page.keyboard.press('Tab'); // focuses on reveal password button
  await page.keyboard.press('Tab'); // focuses submission button

  // Submit with incorrect credentials
  await pressSpacebar('/authenticate');

  await expect(page.getByText('Sign in failed')).toBeVisible();

  const username2 = page.getByLabel('Username');
  const password2 = page.getByLabel('Password');

  await page.keyboard.press('Tab');
  await expect(username2).toBeFocused();
  await username2.fill('demouser');

  await page.keyboard.press('Tab');
  await expect(password2).toBeFocused();
  await password2.fill('j56eKtae*1');

  await page.keyboard.press('Tab'); // focuses on reveal password button
  await page.keyboard.press('Tab'); // focuses submission button

  await pressSpacebar('/authenticate');

  await verifyUserInfo(page, expect);
});
