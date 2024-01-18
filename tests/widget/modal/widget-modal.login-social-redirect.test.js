import { expect, test } from '@playwright/test';
import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test('Modal widget with social callback redirect', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  await navigate('widget/modal?journey=TEST_LoginWithSocial');

  await clickButton('Open Login Modal', '/authenticate');

  const button = page.getByRole('button', { name: 'Continue with Google' });
  await Promise.all([page.waitForNavigation(), button.click()]);

  expect(page.url()).toContain('accounts.google.com', 'redirect_uri');
});

test('Modal widget with social callback redirect no local auth', async ({ page }) => {
  const { navigate } = asyncEvents(page);

  await navigate('widget/modal?journey=TEST_LoginWithSocialNoLocal');

  const loginButton = page.getByRole('button', { name: 'Open Login Modal' });

  await Promise.all([
    page.waitForFunction(() => window.location.origin === 'https://accounts.google.com'),
    loginButton.click(),
  ]);
  expect(page.url()).toContain('accounts.google.com', 'redirect_uri');
});

test('Modal widget with social callback local authentication', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  await navigate('widget/modal?journey=TEST_LoginWithSocial');

  await clickButton('Open Login Modal', '/authenticate');

  await page.getByLabel('Username').fill('demouser');
  await page.getByLabel('Password').fill('j56eKtae*1');

  await clickButton('Next', '/authenticate');

  await verifyUserInfo(page, expect);
});
