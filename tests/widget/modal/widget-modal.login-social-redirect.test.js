import { expect, test } from '@playwright/test';

test('Modal widget with social callback redirect', async ({ page }) => {
  await page.goto('widget/modal?journey=LoginWithSocial', { waitUntil: 'networkidle' });

  const loginButton = page.getByRole('button', { name: 'Open Login Modal' });
  await loginButton.click();

  const button = await page.getByRole('button', { name: 'Continue with Google' });
  await Promise.all([button.click(), page.waitForNavigation()]);
  expect(page.url()).toContain('accounts.google.com', 'redirect_uri');
});

test('Modal widget with social callback redirect no local auth', async ({ page }) => {
  await page.goto('widget/modal?journey=LoginWithSocialNoLocalAuth', { waitUntil: 'networkidle' });

  const loginButton = page.getByRole('button', { name: 'Open Login Modal' });
  await Promise.all([
    loginButton.click(),
    page.waitForFunction(() => window.location.origin === 'https://accounts.google.com'),
  ]);
  expect(page.url()).toContain('accounts.google.com', 'redirect_uri');
});

test('Modal widget with social callback local authentication', async ({ page }) => {
  await page.goto('widget/modal?journey=LoginWithSocial', { waitUntil: 'networkidle' });

  const loginButton = page.getByRole('button', { name: 'Open Login Modal' });
  await loginButton.click();

  await page.fill('text="Username"', 'demouser');
  await page.fill('text=Password', 'j56eKtae*1');
  await page.getByRole('button', { name: 'Next' }).click();

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');

  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});
