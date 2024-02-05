import { test, expect } from '@playwright/test';

test('Modal widget with webauth device name', async ({ page }) => {
  await page.goto('widget/modal?journey=WebAuthn-Registration');
  await page.getByRole('button', { name: 'Open Login Modal' }).click();
  await page.getByLabel('Username').click();
  await page.getByLabel('Username').fill('demouser');
  await page.getByLabel('Username').press('Tab');
  await page.getByLabel('Password').fill('j56eKtae*1');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.waitForResponse((response) => response.url().includes('/authenticate'));
  await expect(page.getByText(/Name your device/, { exact: true })).toBeVisible();
  await expect(page.getByLabel('Optionally name your device')).toBeVisible();
  await page.getByRole('textbox').fill('my device');
  await page.getByRole('button', { name: 'Next' }).click();
});
