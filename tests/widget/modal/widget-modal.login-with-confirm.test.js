import { expect, test } from '@playwright/test';

test('Modal widget with simple login and confirmation', async ({ page }) => {
  await page.goto('widget/modal?journey=LoginTestCallbacks');

  const loginButton = page.locator('button', { hasText: 'Open Login Modal' });
  await loginButton.click();

  await page.fill('text="User Name"', 'demouser');
  await page.locator('button', { hasText: 'Next' }).click();

  await page.fill('text=Password', 'j56eKtae*1');
  await page.locator('button', { hasText: 'Next' }).click();

  // Confirmation
  expect(await page.locator('text="Are you human?"').innerText()).toBe('Are you human?');
  await page.selectOption('select', '0');
  await page.locator('button', { hasText: 'Next' }).click();

  // Choice
  expect(await page.locator('text="Are you sure?"').innerText()).toBe('Are you sure?');
  await page.selectOption('select', '0');
  await page.locator('button', { hasText: 'Next' }).click();

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');

  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});
