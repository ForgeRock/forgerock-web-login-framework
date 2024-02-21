import { expect, test } from '@playwright/test';
import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test('Modal widget with simple login and misc callbacks', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  // TODO update this to a new TEST_ journey once finished
  await navigate('widget/modal?journey=TEST_LoginWithMiscCallbacks');

  await clickButton('Open Login Modal', '/authenticate');

  // Username
  await page.getByLabel('Username').fill('demouser');
  await clickButton('Next', '/authenticate');

  // Password
  await page.getByLabel('Password').fill('j56eKtae*1');
  await clickButton('Next', '/authenticate');

  // Confirmation
  await expect(page.getByText('Are you human?')).toBeVisible();
  await clickButton('Yes', '/authenticate'); // <- Self submitting callback

  // Choice (select)
  const selectEl = page.getByLabel('Are you sure?');
  await selectEl.selectOption('0');
  await clickButton('Next', '/authenticate');

  // Choice (radio)
  // TODO: The below selector should distinguish between the select and radio types
  await expect(page.getByText('Are you sure?')).toBeVisible();
  // TODO: Figure out why regular clicks don't work: https://github.com/microsoft/playwright/issues/13576
  await page.getByLabel('Yes').dispatchEvent('click');
  await clickButton('Next', '/authenticate');

  await expect(page.getByRole('status')).toBeVisible();
  await verifyUserInfo(page, expect);
});
