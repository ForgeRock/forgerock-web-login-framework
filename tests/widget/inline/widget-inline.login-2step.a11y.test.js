import { test, expect } from '@playwright/test';
test('2step login with inline accessiblity', async ({ page }) => {
  await page.goto('widget/inline?journey=LoginWithConfirmation');

  const username = page.getByRole('textbox', { name: /User Name/ });
  await page.keyboard.press('Tab')
  await username.type('demouser');
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')

  const password = page.getByRole('textbox', { name: /Password/ });
  await password.type('j56eKtae*1');
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')


  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);

  const yes = page.getByRole('button', { name: /Yes/ });
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')


  const fullName = page.locator('#fullName');
  const email = page.locator('#email');
  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');

});
