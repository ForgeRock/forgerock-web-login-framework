import { expect, test } from '@playwright/test';
import { asyncEvents, verifyUserInfo } from '../../utilities/async-events';

test.use({ browserName: 'chromium' });
test('Modal widget with webauthn login', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  const cdpSession = await page.context().newCDPSession(page);

  await cdpSession.send('WebAuthn.enable');

  await cdpSession.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasUserVerification: true,
      isUserVerified: true,
      hasResidentKey: true,
    },
  });

  await navigate('widget/modal?journey=TEST_WebAuthn-Registration');

  await clickButton('Open Login Modal', '/authenticate');

  // Try successful login
  await page.getByLabel('Username').fill('demouser');
  await page.getByLabel('Password').fill('j56eKtae*1');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Name your device', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Optionally name your device')).toBeVisible();

  await clickButton('Next', '/authenticate');

  await verifyUserInfo(page, expect);

  await cdpSession.detach();
});
