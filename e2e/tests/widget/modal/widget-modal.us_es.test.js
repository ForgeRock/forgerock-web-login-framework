/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';

import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';
import { password, username } from '../../utilities/demo-user.js';

test.use({ locale: 'es-US' });
test('Modal widget with login in US Spanish', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  await navigate('widget/modal?journey=TEST_Login');

  await clickButton('Open Login Modal', '/authenticate');

  await page.getByLabel('Nombre de usuario').fill(username);
  await page.getByLabel('Contraseña').fill(password);

  await clickButton('Iniciar sesion', '/authenticate');

  await verifyUserInfo(page, expect);
});
