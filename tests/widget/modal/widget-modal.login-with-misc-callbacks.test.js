import { expect, test } from '@playwright/test';

import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test('Modal widget with simple login and misc callbacks', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  // TODO update this to a new TEST_ journey once finished
  await navigate('widget/modal?journey=LoginWithMoreMiscCallbacks');

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

  // Choice (radio)
  // TODO: The below selector should distinguish between the select and radio types
  const radioEl = page.getByLabel('Are you sure?');
  await radioEl.selectOption('0');
  await clickButton('Next', '/authenticate');

  await Promise.all([
    // NOTE: Make sure timer is same or more than set in Polling Wait node
    page.waitForTimeout(3000),
    page.locator('button', { hasText: 'Next' }).click(),
    // Spinner
    expect(page.getByRole('status')).toBeVisible(),
  ]);

  await verifyUserInfo(page, expect);
});
