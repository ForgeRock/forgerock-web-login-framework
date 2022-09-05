import { expect, test } from '@playwright/test';

test('inline widget test fallback to US English with unsupported locale', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'jp' });
  const page = await context.newPage();

  await page.goto('widget/inline');

  await page.fill('text="User Name"', 'demouser');
  await page.fill('text=Password', 'j56eKtae*1');
  await page.locator('button', { hasText: 'Sign In' }).click();

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');

  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});
