import { expect, test } from '@playwright/test';

import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test('Inline widget with login', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  await navigate('widget/inline');

  await page.getByLabel('Username').fill('demouser');
  await page.getByLabel('Password').fill('j56eKtae*1');

  await clickButton('Sign In', '/authenticate');

  await verifyUserInfo(page, expect);
});
