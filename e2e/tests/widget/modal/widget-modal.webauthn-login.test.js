/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';

import { asyncEvents, verifyUserInfo } from '../../utilities/async-events';
import {
  cleanUpRegisteredDevice,
  getSessionToken,
} from '../../utilities/delete-webauthn-device.js';

test.use({ browserName: 'chromium' });

test.describe('modal widget with webauthn login', () => {
  let cdpSession;
  let authenticatorId;
  let registeredCredentialId;
  let sessionToken;

  test.beforeEach(async ({ page, request }) => {
    sessionToken = await getSessionToken(request, 'demouser', 'j56eKtae*1');
    cdpSession = await page.context().newCDPSession(page);
    await cdpSession.send('WebAuthn.enable');
    ({ authenticatorId } = await cdpSession.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasUserVerification: true,
        isUserVerified: true,
        hasResidentKey: true,
      },
    }));
    registeredCredentialId = null;
    cdpSession.on('WebAuthn.credentialAdded', ({ credential }) => {
      registeredCredentialId = credential.credentialId
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/u, '');
    });
  });

  test.afterEach(async ({ request }) => {
    await cleanUpRegisteredDevice(request, registeredCredentialId, sessionToken);
    await cdpSession.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId });
    await cdpSession.detach();
  });

  test('registers and authenticates', async ({ page }) => {
    const { clickButton, navigate } = asyncEvents(page);

    await navigate('widget/modal?journey=TEST_WebAuthn-Registration');

    await clickButton('Open Login Modal', '/authenticate');

    await page.getByLabel('Username').fill('demouser');
    await page.getByLabel('Password').fill('j56eKtae*1');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Name your device', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Optionally name your device')).toBeVisible();

    await clickButton('Next', '/authenticate');

    await verifyUserInfo(page, expect);
  });
});

test('modal widget exposes passkey autofill attributes on the mixed authentication journey', async ({
  page,
}) => {
  const { clickButton, navigate } = asyncEvents(page);

  await navigate('widget/modal?journey=TEST_AutofillPasskeyWebAuthn_autocomplete_conditional');
  await clickButton('Open Login Modal', '/authenticate');

  const usernameInput = page.getByLabel('Username');

  await expect(usernameInput).toBeVisible();
  await expect(usernameInput).toHaveAttribute('autocomplete', 'username webauthn');
});
