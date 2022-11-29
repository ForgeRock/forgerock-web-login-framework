import { expect, test } from '@playwright/test';

test.use({ locale: 'es-US' });
test('modal widget in US Spanish', async ({ page }) => {
  await page.goto('widget/modal', { waitUntil: "networkidle" });

  const loginButton = page.locator('button', { hasText: 'Open Login Modal' });

  await loginButton.click();

  await page.waitForEvent("requestfinished");
  await page.fill('text="Nombre de usuario"', 'demouser');
  await page.fill('text=Contraseña', 'j56eKtae*1');

  await page.locator('button', { hasText: 'Iniciar sesion' }).click();

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');

  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});
