import { expect, test } from '@playwright/test';

import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test.use({ locale: 'fr-CA' });
test('Inline widget with login in Canadian French', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  await navigate('widget/inline?journey=TEST_Login');

  await page.getByLabel('utilisateur').fill('demouser');
  await page.getByLabel('Mot de passe').fill('j56eKtae*1');

  await expect(page.getByText('Se connecter')).toBeVisible();
  await clickButton('Se connecter', '/authenticate');

  await verifyUserInfo(page, expect);
});
