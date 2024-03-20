import { expect, test } from '@playwright/test';
import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test('inline widget with webauthn login', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  const cdpSession = await page.context().newCDPSession(page);

  await cdpSession.send('WebAuthn.enable');
  const authenticator = await cdpSession.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasUserVerification: true,
      isUserVerified: true,
      hasResidentKey: true,
    },
  });

  await navigate('widget/inline?journey=TEST_WebAuthn-Registration');

  await page.getByLabel('Username').fill('demouser');
  await page.getByLabel('Password').fill('j56eKtae*1');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Name your device', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Optionally name your device')).toBeVisible();
  await page.getByRole('textbox').fill('my device');
  await clickButton('Next', '/authenticate');

  await verifyUserInfo(page, expect);

  await cdpSession.send('WebAuthn.removeVirtualAuthenticator', {
    authenticatorId: authenticator.authenticatorId,
  });
});
