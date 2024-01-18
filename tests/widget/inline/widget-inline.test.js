import { expect, test } from '@playwright/test';
import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test('Inline widget with login', async ({ page }) => {
  const messageArray = [];

  // Listen for events on page
  page.on('console', async (msg) => {
    return messageArray.push(msg.text());
  });

  const { clickButton, navigate } = asyncEvents(page);
  await navigate('widget/inline?journey=TEST_Login');

  await page.getByRole('textbox', { name: 'Username' }).type('demouser');
  await page.getByRole('textbox', { name: 'Password' }).type('j56eKtae*1');

  await clickButton('Sign In', '/authenticate');

  await verifyUserInfo(page, expect);

  // Form onMount()
  expect(messageArray.includes('Form mounted')).toBe(true);
});
