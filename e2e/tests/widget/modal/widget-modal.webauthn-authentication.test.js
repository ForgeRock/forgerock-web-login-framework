/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';
import { asyncEvents } from '../../utilities/async-events';

test.use({ browserName: 'chromium' });

test('modal widget exposes passkey autofill attributes on the mixed authentication journey', async ({
  page,
}) => {
  const { clickButton, navigate } = asyncEvents(page);

  await navigate('widget/modal?journey=VatsalWebAuthnAuthentication');
  await clickButton('Open Login Modal', '/authenticate');

  const usernameInput = page.getByLabel('Username');

  await expect(usernameInput).toBeVisible();
  await expect(usernameInput).toHaveAttribute('autocomplete', 'username webauthn');
});
