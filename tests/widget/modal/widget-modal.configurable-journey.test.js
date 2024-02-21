import { expect, test } from '@playwright/test';

import { asyncEvents } from '../../utilities/async-events.js';

test('Modal widget with testing journey changes', async ({ page }) => {
  const { clickLink, clickButton, navigate } = asyncEvents(page);

  await navigate('widget/modal?journey=TEST_Login');

  await clickButton('Open Login Modal', '/authenticate');

  // Move to Registration page
  await clickLink('Register here!', '/authenticate');
  // Check for unique text on registration page
  await expect(page.getByText('Already have an account? Sign in here!')).toBeVisible();

  // Change to go back to Sign In page
  await clickLink('Sign in here!', '/authenticate');

  // Click "forgot password" button
  await clickButton('Forgot password?', '/authenticate');
  // Check for proper header
  await expect(page.getByText('Reset Password')).toBeVisible();

  // Get all buttons
  const buttons = page.getByRole('button');
  // Is last button the "Back to" button?
  await expect(buttons.last()).toHaveText('Back to Sign In');

  // It's important that this email is UNIQUE in the system or this test will fail
  await page.getByLabel('Email address').fill('forget-password@keepunique.com');

  await clickButton('Next', '/authenticate');

  const paragraph = page.getByText(
    'An email has been sent to the address you entered. Click the link in that email to proceed.',
  );
  await expect(paragraph).toBeVisible();
});
