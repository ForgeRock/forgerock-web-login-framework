import { expect, test } from '@playwright/test';
import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test.use({ locale: 'es' });
test('Inline widget with login in Spanish with unknown country', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  await navigate('widget/inline?journey=TEST_Login');

  await page.getByLabel('Nombre de usuario').fill('demouser');
  await page.getByLabel('Contraseña').fill('j56eKtae*1');

  await clickButton('Iniciar sesion', '/authenticate');

  await verifyUserInfo(page, expect);
});
