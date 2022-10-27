import { expect, test } from '@playwright/test';

test('2step login with access', async ({ page }) => {
  await page.goto('widget/modal?journey=LoginWithConfirmation');

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
  await page.keyboard.press('Tab')
  await username.type('demouser');
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')

  const password = page.getByRole('textbox', { name: /Password/ });
  await password.type('j56eKtae*1');
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')

  const yes = page.getByRole('button', { name: /Yes/ });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000)

  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')


  const fullName = page.locator('#fullName');
  const email = page.locator('#email');
  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');

});
