import { expect, test } from '@playwright/test';

test('inline widget in Spanish with unknown country', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es' });
  const page = await context.newPage();

  await page.goto('widget/inline');

  await page.fill('text="Nombre de usuario"', 'demouser');
  await page.fill('text=Contraseña', 'j56eKtae*1');
  await page.locator('button', { hasText: 'Iniciar sesion' }).click();

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');

  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});
