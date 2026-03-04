/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';
import { asyncEvents } from '../../utilities/async-events.js';

test('Modal widget with collecting a device profile after login', async ({ page, context }) => {
  const { navigate } = asyncEvents(page);

  await context.grantPermissions(['geolocation']);
  await navigate('widget/inline?journey=TEST_DeviceProfileNode');

  await page.getByRole('textbox', { name: 'Username' }).type('demouser');
  await page.getByRole('textbox', { name: 'Password' }).type('j56eKtae*1');

  await page.getByRole('button', { name: 'Next' }).click();
  await page.route('**/authenticate**', (request) => {
    const data = request.postDataJSON();

    const inputJSON = data.callbacks[0].input[0].value;
    const input = JSON.parse(inputJSON);

    expect(input.identifier).toBeTruthy();
    expect(input.metadata.browser.userAgent).toBeTruthy();
  });

  await page.getByText('Collecting Profile').isVisible();

  await context.clearPermissions();
});
