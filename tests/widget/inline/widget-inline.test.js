import { expect, test } from '@playwright/test';

import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test('Inline widget with login', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);
  await navigate('widget/inline?journey=TEST_Login');

  await page.getByRole('textbox', { name: 'Username' }).type('demouser');
  await page.getByRole('textbox', { name: 'Password' }).type('j56eKtae*1');

  await clickButton('Sign In', '/authenticate');

  await verifyUserInfo(page, expect);
});
