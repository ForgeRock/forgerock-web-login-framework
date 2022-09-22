import { expect, test } from '@playwright/test';
import { v4 as uuid } from 'uuid';

test('modal widget', async ({ page }) => {
  await page.goto('widget/modal?journey=ResetPassword');
  const loginButton = page.locator('button', { hasText: 'Open Login Modal' });
  const dialog = page.locator('dialog');

  expect(await dialog.isVisible()).toBeFalsy();
  await loginButton.click();
  expect(await dialog.isVisible()).toBeTruthy();

  const resetPasswordHeader = page.locator('h1');

  expect(await resetPasswordHeader.innerText()).toBe('Reset Password');

  await page.fill('text="Email Address"', uuid());

  const nextButton = page.locator('button', { hasText: 'Next' })
  expect(await nextButton.innerText()).toBe('Next');

  await nextButton.click();

  const content = page.locator('p', { hasText: 'An email has been sent to the address you entered. Click the link in that email to proceed.'});
  expect(content.isVisible()).toBeTruthy();

});
