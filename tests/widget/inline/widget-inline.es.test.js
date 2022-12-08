import { expect, test } from '@playwright/test';

test.use({ locale: 'es' });
test('inline widget in Spanish with unknown country', async ({ page }) => {
  await page.goto('widget/inline');

  await page.getByRole('textbox', { name: 'Nombre de usuario' }).fill('demouser');

  await page.getByRole('textbox', { name: 'Contraseña' }).fill('j56eKtae*1');

  const submit = await page.getByRole('button', { name: 'Iniciar sesion' });

  submit.click();

  const fullName = page.locator('#fullName');
  const email = page.locator('#email');

  expect(await fullName.innerText()).toBe('Full name: Demo User');
  expect(await email.innerText()).toBe('Email: demo@user.com');
});
