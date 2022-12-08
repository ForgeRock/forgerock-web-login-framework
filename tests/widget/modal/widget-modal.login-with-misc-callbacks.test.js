import { expect, test } from '@playwright/test';

test('Modal widget with simple login and misc callbacks', async ({ page }) => {
  await page.goto('widget/modal?journey=LoginWithMiscCallbacks');

  const loginButton = page.locator('button', { hasText: 'Open Login Modal' });
  await loginButton.click();

  await page.fill('text="Username"', 'demouser');
  await page.locator('button', { hasText: 'Next' }).click();

  await page.fill('text=Password', 'j56eKtae*1');
  await page.locator('button', { hasText: 'Next' }).click();

  // Confirmation
  expect(await page.locator('text="Are you human?"').innerText()).toBe('Are you human?');
  await page.locator('button', { hasText: 'Yes' }).click(); // <- Self submitting callback

  // Choice
  const selectEl = page.getByLabel('Are you sure?');
  await selectEl.selectOption('0');
  await Promise.all([
    page.locator('button', { hasText: 'Next' }).click(),

    // Polling Wait
    // NOTE: Make sure timer is same or more than set in Polling Wait node
    page.waitForTimeout(3000),
  ]);

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');

  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});
