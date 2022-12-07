import { expect, test } from '@playwright/test';

test('inline widget', async ({ page }) => {
  await page.goto('widget/inline');

  await page.fill('text="Username"', 'demouser');
  await page.fill('text=Password', 'j56eKtae*1');
  await page.locator('button', { hasText: 'Sign In' }).click();

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');

  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});
