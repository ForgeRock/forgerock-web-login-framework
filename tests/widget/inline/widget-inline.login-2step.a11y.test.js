import { test, expect } from '@playwright/test';
import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test('Inline widget with 2step login, keyboard only', async ({ page }) => {
  const { navigate, pressSpacebar } = asyncEvents(page);

  await navigate('widget/inline?journey=TEST_LoginWithConfirmation');

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
