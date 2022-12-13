import { expect, test } from '@playwright/test';

test('modal widget and testing changing journeys', async ({ page }) => {
  await page.goto('widget/modal');

  const loginButton = page.locator('button', { hasText: 'Open Login Modal' });
  const dialog = page.locator('dialog');
  expect(await dialog.isVisible()).toBeFalsy();

  await Promise.all([
    loginButton.click(),
    // Add just a bit of a delay to ensure dialog responds
    page.waitForEvent('requestfinished'),
  ]);
  expect(await dialog.isVisible()).toBeTruthy();

  // Select registration to test link capturing
  const forgotUsernameBtn = page.getByRole('link', { name: 'Register here!' });
  await forgotUsernameBtn.click();

  const forgotUsernameHeader = page.getByText('Already have an account? Sign in here!');
  await forgotUsernameHeader.waitFor({ state: 'visible' });

  // Change to go back to Sign In
  const backToSignInBtn = page.getByRole('link', { name: 'Sign in here!' });
  await backToSignInBtn.click();

  // Click "forgot password"
  const forgotPasswordBtn = page.getByRole('button', { name: 'Forgot password?' });
  await forgotPasswordBtn.click();

  const forgotPasswordHeader = page.getByText('Reset Password');
  await forgotPasswordHeader.waitFor({ state: 'visible' });

  // Get all buttons
  const buttons = page.getByRole('button');
  // Is last button the "Back to" button?
  expect(await buttons.last().innerText()).toBe('Back to Sign In');

  // It's important that this email is UNIQUE in the system or this test will fail
  const email = page.getByRole('textbox', { name: 'Email address' });
  await email.type('forget-password@keepunique.com');

  await page.getByRole('button', { name: 'Next' }).click();

  const paragraph = page.getByText(
    'An email has been sent to the address you entered. Click the link in that email to proceed.',
  );
  await paragraph.waitFor({ state: 'visible' });

  expect(await paragraph.isVisible()).toBe(true);
});
