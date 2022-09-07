import { expect, test } from '@playwright/test';
import { v4 as uuid } from 'uuid';

test('modal widget', async ({ page }) => {
  await page.goto('widget/modal?journey=Registration');
  const loginButton = page.locator('button', { hasText: 'Open Login Modal' });
  const dialog = page.locator('dialog');
  expect(await dialog.isVisible()).toBeFalsy();

  await loginButton.click();
  expect(await dialog.isVisible()).toBeTruthy();

  await page.fill('text="Username"', uuid());
  await page.fill('text=First Name', 'Demo');
  await page.fill('text=Last Name', 'User');
  await page.fill('text=Email Address', 'demo@user.com');
  await page.fill('text=Password', 'j56eKtae*1');
  await page.selectOption('select', '0');
  await page.fill('text=Security Answer', 'Red');
  await page.click('text=Please accept our Terms and Conditions');
  await page.locator('button', { hasText: 'Register' }).click();

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');

  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});
