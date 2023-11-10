import { expect, test } from '@playwright/test';

import { asyncEvents } from '../../utilities/async-events.js';

test('Modal widget with email suspend', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  await navigate('widget/modal?journey=TEST_LoginSuspendEmail');

  await clickButton('Open Login Modal', '/authenticate');

  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByLabel('Username').fill('demouser');
  await page.getByLabel('Password').fill('j56eKtae*1');

  await clickButton('Next', '/authenticate');

  // Grab the form to reduce scope for next assertions
  const form = page.locator('form');

  // Unique header for Email Suspend stage
  await expect(form.getByText('Check your email')).toBeVisible();

  // We should have a paragraph of text from the callback
  // The actual text is not important, so check truthiness
  expect(await form.getByRole('paragraph').innerText()).toBeTruthy();

  // There should be no submit button within form
  await expect(form.getByRole('button')).not.toBeAttached();
});
