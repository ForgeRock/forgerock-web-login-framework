import { expect, test } from '@playwright/test';
import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test('Inline widget with additional stage attribute testing', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  await navigate('widget/inline?journey=TEST_RegisterWithStageAttributes');

  await page.getByLabel('Username').fill('demouser');

  await page.getByLabel('Password', { exact: true }).fill('j56eKtae*1');
  // await page.getByLabel('Confirm password').fill('not a match');
  // await page.keyboard.press('Tab'); // focuses off confirm password

  // await expect(page.getByText('Passwords do not match')).toBeVisible();

  // TODO: Figure out why regular clicks don't work: https://github.com/microsoft/playwright/issues/13576
  await page.getByLabel('I agree').dispatchEvent('click');

  // await page.getByLabel('Confirm password').fill('failvalidation');
  await page.keyboard.press('Tab'); // focuses off confirm password

  // Ensure error message is removed
  // await expect(page.getByText('Passwords do not match')).toBeHidden();

  // Resubmit form
  await clickButton('Next', '/authenticate');

  // Ensure error message is removed
  // await expect(page.getByText('Passwords do not match')).toBeHidden();

  // await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
  // await expect(page.getByLabel('Confirm password')).toHaveValue('');

  // await page.getByLabel('Password', { exact: true }).fill('j56eKtae*1');
  // await page.getByLabel('Confirm password').fill('not a match');
  // await page.keyboard.press('Tab'); // focuses off confirm password

  // await expect(page.getByText('Passwords do not match')).toBeVisible();

  // await page.getByLabel('Confirm password').fill('j56eKtae*1');
  // await page.keyboard.press('Tab'); // focuses off confirm password

  // // Ensure error message is removed
  // await expect(page.getByText('Passwords do not match')).toBeHidden();

  // // Resubmit form
  // await clickButton('Next', '/authenticate');

  await expect(page.getByText('Are you human')).toBeVisible();
  // TODO: Figure out why regular clicks don't work: https://github.com/microsoft/playwright/issues/13576
  await page.getByLabel('Yes').dispatchEvent('click');

  // Resubmit form
  await clickButton('Next', '/authenticate');

  await verifyUserInfo(page, expect);
});
