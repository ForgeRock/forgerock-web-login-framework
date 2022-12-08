import { expect, test } from '@playwright/test';

test('2step login with access', async ({ page }) => {
  await page.goto('widget/modal?journey=LoginWithConfirmation', { waitUntil: 'networkidle' });

  const dialog = page.locator('dialog');
  expect(await dialog.isVisible()).toBeFalsy();

  // this is for the start page not for the app
  await page.keyboard.press('Tab');

  await Promise.all([
    // this event triggers the request
    page.keyboard.press('Enter'),
    page.waitForEvent('requestfinished'),
    // regex to match, made it this way to match on a future am url that may have some different domain
    // its a bit ugly but i went through regex101 and this should do the trick for at least this
    // characater sequence.
    // page.waitForResponse(/^(.*?)\/am\/json\/realms\/root\/realms\/alpha\/authenticate(.*)/gm, { timeout: 5000 }),
  ]);

  expect(await dialog.isVisible()).toBeTruthy();

  const username = page.getByRole('textbox', { name: /Username/ });
  await page.keyboard.press('Tab');
  await username.type('demouser');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');

  const password = page.getByRole('textbox', { name: /Password/ });
  await password.type('j56eKtae*1');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  const yes = page.getByRole('button', { name: /Yes/ });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);

  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');
  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});
