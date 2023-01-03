import { expect, test } from '@playwright/test';

import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test('Inline widget with login', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);
  await navigate('widget/inline');

  await page.getByRole('textbox', { name: 'Username' }).type('demouser');
  await page.getByRole('textbox', { name: /password/i }).type('j56eKtae*1');

  await clickButton('Sign In', '/authenticate');

  await verifyUserInfo(page, expect);
});
