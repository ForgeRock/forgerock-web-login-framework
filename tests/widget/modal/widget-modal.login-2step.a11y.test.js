import { expect, test } from '@playwright/test';
import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test('Modal widget with 2step login, keyboard only', async ({ page }) => {
  const { navigate, pressEnter, pressSpacebar } = asyncEvents(page);

  await navigate('widget/modal?journey=TEST_LoginWithConfirmation');

  await expect(page.getByRole('dialog')).toBeHidden();

  // Move focus to the "open modal" button and trigger it
  await page.keyboard.press('Tab');
  await pressEnter('/authenticate');

  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByLabel('Username').fill('demouser');

  await page.keyboard.press('Tab'); // focuses submission button
  await pressSpacebar('/authenticate');

  await page.getByLabel('Password').fill('j56eKtae*1');
  await page.keyboard.press('Tab'); // focuses view password button

  await page.keyboard.press('Tab'); // focuses submission button
  await pressSpacebar('/authenticate');

  const yesBtn = page.getByRole('button', { name: 'Yes' });
  await yesBtn.focus(); // focuses on positive response button

  await pressSpacebar('/authenticate');

  await verifyUserInfo(page, expect);
});
