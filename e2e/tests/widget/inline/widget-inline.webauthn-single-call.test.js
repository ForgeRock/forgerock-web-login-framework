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

/**
 * This test verifies that the WebAuthn API is called only once during authentication.
 *
 * Bug context: The reactive block in webauthn.svelte was previously triggering
 * the WebAuthn API call multiple times due to Svelte's reactive system re-running
 * the block when dependencies changed. This caused the browser's WebAuthn prompt
 * to appear twice, creating a poor user experience.
 *
 * Fix: Added a guard variable `webAuthnApiCalled` to ensure the API is only
 * called once per component lifecycle.
 */
test('WebAuthn authentication should only trigger the credential API once', async ({ page }) => {
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

  // Track the number of times navigator.credentials.create is called
  let webAuthnCallCount = 0;

  // Listen for WebAuthn credential creation events
  cdpSession.on('WebAuthn.credentialAdded', () => {
    webAuthnCallCount++;
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

  // Verify the WebAuthn API was called exactly once
  expect(webAuthnCallCount).toBe(1);

  await cdpSession.send('WebAuthn.removeVirtualAuthenticator', {
    authenticatorId: authenticator.authenticatorId,
  });
});

test('WebAuthn registration should only trigger the credential API once after device naming', async ({
  page,
}) => {
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

  // Track WebAuthn calls using page console logs
  const webAuthnCalls = [];

  // Inject tracking before the page loads
  await page.addInitScript(() => {
    const originalCreate = navigator.credentials.create.bind(navigator.credentials);
    navigator.credentials.create = async function (...args) {
      console.log('WEBAUTHN_CREATE_CALLED');
      return originalCreate(...args);
    };
  });

  // Listen for our tracking logs
  page.on('console', (msg) => {
    if (msg.text() === 'WEBAUTHN_CREATE_CALLED') {
      webAuthnCalls.push(Date.now());
    }
  });

  await navigate('widget/inline?journey=TEST_WebAuthn-Registration');

  await page.getByLabel('Username').fill('demouser');
  await page.getByLabel('Password').fill('j56eKtae*1');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Name your device', { exact: true })).toBeVisible();

  // Don't fill device name, just click next
  await clickButton('Next', '/authenticate');

  await verifyUserInfo(page, expect);

  // Verify navigator.credentials.create was called exactly once
  expect(webAuthnCalls.length).toBe(1);

  await cdpSession.send('WebAuthn.removeVirtualAuthenticator', {
    authenticatorId: authenticator.authenticatorId,
  });
});
