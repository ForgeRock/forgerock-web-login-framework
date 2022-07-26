import { expect, test } from '@playwright/test';

test('modal widget in US Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-US' });
  const page = await context.newPage();

  await page.goto('widget/modal');
  const loginButton = page.locator('button', { hasText: 'Open Login Modal' });
  const dialog = page.locator('dialog');
  expect(await dialog.isVisible()).toBeFalsy();

  await loginButton.click();
  expect(await dialog.isVisible()).toBeTruthy();

  await page.fill('text="Nombre de usuario"', 'demouser');
  await page.fill('text=Contraseña', 'j56eKtae*1');
  await page.locator('button', { hasText: 'Iniciar sesion' }).click();

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');

  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});
