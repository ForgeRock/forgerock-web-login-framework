import { expect, test } from '@playwright/test';

import { asyncEvents } from '../../utilities/async-events.js';

test('collect a device profile after login', async ({ page, context }) => {
  const { clickButton, navigate } = asyncEvents(page);
  await context.grantPermissions(['geolocation']);
  await navigate('widget/inline?journey=TEST_DeviceProfileNode');
  await page.getByRole('textbox', { name: 'Username' }).type('demouser');
  await page.getByRole('textbox', { name: 'Password' }).type('j56eKtae*1');

  await clickButton('Next', '/authenticate');
  const returnedPage = page.on('request', (request) => {
    const data = request.postData();
    const parsed = JSON.parse(data);
    const inputJSON = parsed.callbacks[0].input[0].value;
    const input = JSON.parse(inputJSON);
    expect(input.identifier).toBeTruthy();
    expect(input.metadata.browser.userAgent).toBeTruthy();
  });
  context.clearPermissions();
  returnedPage.removeListener('request', () => {
    console.log('removed');
  });
});
