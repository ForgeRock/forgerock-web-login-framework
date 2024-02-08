import { expect, test } from '@playwright/test';
import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

//Use create and delete users and use the data in replace of 'demouser'
test('Modal widget with login', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  const messageArray = [];

  // Listen for events on page
  page.on('console', async (msg) => {
    return messageArray.push(msg.text());
  });

  // Navigate to page without Widget instantiation
  await navigate('widget');

  const loginLink = page.getByRole('link', { name: 'Login via Modal Widget' });

  await expect(loginLink).toBeVisible();

  await navigate('widget/modal?journey=TEST_Login');

  await expect(page.getByRole('dialog')).toBeHidden();

  // Try failed login
  await clickButton('Open Login Modal', '/authenticate');

  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByLabel('Username').fill('notauser');
  await page.getByLabel('Password').fill('notapassword');

  await clickButton('Sign In', '/authenticate');

  await expect(page.getByText('Sign in failed')).toBeVisible();

  // Try successful login
  await page.getByLabel('Username').fill('demouser');
  await page.getByLabel('Password').fill('j56eKtae*1');

  await clickButton('Sign In', '/authenticate');

  await verifyUserInfo(page, expect);

  // Navigate to page without Widget instantiation
  await navigate('widget');

  // Refresh the page to clear out previous Widget references
  await page.reload({ waitUntil: 'networkidle' });

  // Test the config and user API without Widget references
  await verifyUserInfo(page, expect);

  // Journey onFailure()
  expect(messageArray.includes('Login failure event fired')).toBe(true);
});
