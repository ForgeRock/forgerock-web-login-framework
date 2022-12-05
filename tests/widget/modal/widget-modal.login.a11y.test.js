import { expect, test } from '@playwright/test';

test('modal widget accessibility', async ({ page }) => {
  await page.goto('widget/modal', { waitUntil: "networkidle" });

  const dialog = page.locator('dialog');
  expect(await dialog.isVisible()).toBeFalsy();
  const button = page.getByRole('button', { name: 'Open Login Modal' })

  // this is for the start page not for the app
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter')

  // Add just a bit of a delay to ensure dialog responds
  await page.waitForTimeout(1000);
  expect(await dialog.isVisible()).toBeTruthy();

  const username = page.getByRole('textbox', { name: /User Name/ });
  const password = page.getByRole('textbox', { name: /Password/ });

  await page.keyboard.press('Tab')
  expect(username).toBeFocused();
  await username.type('username01');

  await page.keyboard.press('Tab')
  expect(password).toBeFocused();
  await password.type('password');

  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')


  const loginBtn = page.getByRole('button', { name: 'Sign In' })
  await page.keyboard.press('Tab')

  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle');

  const user_name = page.getByRole('textbox', { name: 'User Name' });
  const pw = page.getByRole('textbox', { name: 'Password' });
  const tryAgain = page.getByText('Login failure');

  expect(await tryAgain.textContent()).toBe('Login failure');
  await page.keyboard.press('Tab');

  await user_name.type('demouser');

  await page.keyboard.press('Tab');
  await pw.type('j56eKtae*1');

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');

  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});
