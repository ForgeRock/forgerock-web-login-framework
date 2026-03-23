/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';
import { asyncEvents } from '../../utilities/async-events.js';

test.use({ browserName: 'chromium' });

test('inline widget exposes passkey autofill attributes on the mixed authentication journey', async ({
  page,
}) => {
  const { navigate } = asyncEvents(page);

  await navigate('widget/inline?journey=VatsalWebAuthnAuthentication');

  const usernameInput = page.getByLabel('Username');

  await expect(usernameInput).toBeVisible();
  await expect(usernameInput).toHaveAttribute('autocomplete', 'username webauthn');
});
