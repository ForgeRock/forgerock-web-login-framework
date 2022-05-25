import { expect, test } from '@playwright/test';

test('index page has expected h1', async ({ page }) => {
	await page.goto('widget');
	const loginButton = page.locator('text=Login');
  const dialog = page.locator('dialog');
  expect(await loginButton.innerText()).toBe('Login');
  expect(await dialog.isVisible()).toBeFalsy();

  await loginButton.click();
  expect(await dialog.isVisible()).toBeTruthy();

  const usernameInput = page.locator('#Username');
  const passwordInput = page.locator('#Password');
  const submitButton = page.locator('text=Submit');

  await usernameInput.fill('demouser');
  await passwordInput.fill('j56eKtae*1');
  await submitButton.click();

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');

  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});
