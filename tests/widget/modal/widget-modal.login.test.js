import { expect, test } from '@playwright/test';

test('modal widget', async ({ page }) => {
  await page.goto('widget/modal');
  const loginButton = page.locator('button', { hasText: 'Open Login Modal' });
  const dialog = page.locator('dialog');
  expect(await dialog.isVisible()).toBeFalsy();

  await loginButton.click();
  expect(await dialog.isVisible()).toBeTruthy();

  await page.fill('text="User Name"', 'demouser');
  await page.fill('text=Password', 'j56eKtae*1');
  await page.locator('button', { hasText: 'Sign In' }).click();

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');

  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});
