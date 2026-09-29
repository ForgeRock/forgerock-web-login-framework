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

test.use({ locale: 'fr-CA' });
test('Inline widget with login in Canadian French', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  await navigate('widget/inline?journey=TEST_Login');

  await page.getByLabel('utilisateur').fill(username);
  await page.getByLabel('Mot de passe').fill(password);

  await expect(page.getByText('Se connecter')).toBeVisible();
  await clickButton('Se connecter', '/authenticate');

  await verifyUserInfo(page, expect);
});
