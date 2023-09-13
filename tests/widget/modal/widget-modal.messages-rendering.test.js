import { expect, test } from '@playwright/test';
import { asyncEvents } from '../../utilities/async-events.js';

test('Modal widget with different messages type', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  // Navigate to page without Widget instantiation
  await navigate('widget');

  const loginLink = page.getByRole('link', { name: 'Login via Modal Widget' });

  await expect(loginLink).toBeVisible();

  await navigate('widget/modal?journey=TextOutputCallback_LW');

  await expect(page.getByRole('dialog')).toBeHidden();

  // Try failed login
  await clickButton('Open Login Modal', '/authenticate');

  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByLabel('Username').fill('user11');
  await page.getByLabel('Password').fill('asd');

  await clickButton('Next', '/authenticate');

  await expect(
    page.getByText('You have exceeded login attempts. Please contact support.'),
  ).toBeVisible();

  // Try successful login
  await page.getByLabel('Username').fill('user11');
  await page.getByLabel('Password').fill('Password1!');

  await clickButton('Next', '/authenticate');

  await expect(page.getByText('Hey, you made it...')).toHaveCount(2);
});
