import { expect, test } from '@playwright/test';
import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test('inline widget with webauthn login', async ({ browser, page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  let authenticator;
  if (browser.browserType().name() === 'chromium') {
    const cdpSession = await page.context().newCDPSession(page);

    await cdpSession.send('WebAuthn.enable');
    authenticator = await cdpSession.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasUserVerification: true,
        isUserVerified: true,
        hasResidentKey: true,
      },
    });

    await navigate('widget/inline?journey=TEST_WebAuthn-Registration');

    // Try failed login
    await page.getByLabel('Username').fill('notauser');
    await page.getByLabel('Password').fill('notapassword');

    await clickButton('Next', '/authenticate');

    await expect(page.getByText('Sign in failed')).toBeVisible();

    // Try successful login
    await page.getByLabel('Username').fill('demouser');
    await page.getByLabel('Password').fill('j56eKtae*1');

    await clickButton('Next', '/authenticate');

    await verifyUserInfo(page, expect);

    await cdpSession.send('WebAuthn.removeVirtualAuthenticator', {
      authenticatorId: authenticator.authenticatorId,
    });
  }
});
