import { expect, test } from '@playwright/test';

test.use({ locale: 'fr-CA' });
test('inline widget in Canadian French', async ({ page }) => {
  await page.goto('widget/inline');

  await page.fill('text="Nom d\'utilisateur"', 'demouser');
  await page.fill('text=Mot de passe', 'j56eKtae*1');
  await page.locator('button', { hasText: 'Se connecter' }).click();

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');

  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});
