import { expect, test } from '@playwright/test';

test('modal widget', async ({ page }) => {
  await page.goto('widget/modal');
  const loginButton = page.locator('text=Login');
  const dialog = page.locator('dialog');
  expect(await loginButton.innerText()).toBe('Login');
  expect(await dialog.isVisible()).toBeFalsy();

  await loginButton.click();
  expect(await dialog.isVisible()).toBeTruthy();

  await page.fill('text="User Name"', 'demouser');
  await page.fill('text=Password', 'j56eKtae*1');
  await page.locator('text=Submit').click();

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');

  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});

test('inline widget', async ({ page }) => {
  await page.goto('widget/inline');

  await page.fill('text="User Name"', 'demouser');
  await page.fill('text=Password', 'j56eKtae*1');
  await page.locator('text=Submit').click();

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');

  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});
