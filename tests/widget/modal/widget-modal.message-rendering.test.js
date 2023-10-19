import { expect, test } from '@playwright/test';
import { asyncEvents } from '../../utilities/async-events.js';

test('Modal widget with different messages type', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  // Navigate to page without Widget instantiation
  await navigate('widget');

  const loginLink = page.getByRole('link', { name: 'Login via Modal Widget' });

  await expect(loginLink).toBeVisible();

  await navigate('widget/modal?journey=TEST_TextOutputCallback');

  await expect(page.getByRole('dialog')).toBeHidden();

  await clickButton('Open Login Modal', '/authenticate');

  await expect(page.getByRole('dialog')).toBeVisible();

  // Try failed logins first.
  await page.getByLabel('Username').fill('notauser');
  await page.getByLabel('Password').fill('notapassword');

  await clickButton('Next', '/authenticate');

  await expect(
    page.getByText('Your username or password is incorrect. Please try again.'),
  ).toBeVisible();

  // Fail login one more time.
  await page.getByLabel('Username').fill('notauser');
  await page.getByLabel('Password').fill('notapassword');

  await clickButton('Next', '/authenticate');

  await expect(page.getByText('You have exceeded login attempts.')).toBeVisible();

  // Refresh the page and start over.
  await page.reload();

  // Reopen modal
  await clickButton('Open Login Modal', '/authenticate');
  // Dialog should be visible
  await expect(page.getByRole('dialog')).toBeVisible();

  // Login with correct username password
  await page.getByLabel('Username').fill('demouser');
  await page.getByLabel('Password').fill('j56eKtae*1');

  await clickButton('Next', '/authenticate');

  await expect(page.getByText('Success! Welcome back.')).toBeVisible();
});
