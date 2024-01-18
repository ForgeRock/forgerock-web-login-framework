import { expect, test } from '@playwright/test';
import { asyncEvents, verifyUserInfo } from '../../utilities/async-events.js';

test('Modal widget with login', async ({ context, page }) => {
  // Only Chromium browsers need granted permission to clipboard
  if (context.browser().browserType().name() === 'chromium') {
    context.grantPermissions(['clipboard-read']);
  }

  const { clickButton, navigate } = asyncEvents(page);

  const messageArray = [];

  // Listen for events on page
  page.on('console', async (msg) => {
    return messageArray.push(msg.text());
  });

  await navigate('widget/modal?journey=TEST_RegisterOATH');

  await clickButton('Open Login Modal', '/authenticate');

  await page.getByLabel('Username').fill('demouser');
  await page.getByLabel('Password').fill('j56eKtae*1');

  await clickButton('Next', '/authenticate');

  // Ensure alternative methods are hidden, then open details, check visibility and copy URL
  const inputUrl = page.getByLabel('URL:');
  const copyUrlBtn = page.getByRole('button', { name: 'Copy URL' });

  await expect(inputUrl).toBeHidden();
  await page.getByText('Not working or need an alternative method?').click();
  await expect(inputUrl).toBeVisible();

  // Only Chromium browsers support `navigator.clipboard.readText()`
  if (context.browser().browserType() === 'chromium') {
    await copyUrlBtn.click();
    const copiedText = await page.evaluate('navigator.clipboard.readText()');
    expect(copiedText).toContain('otpauth://');
  }

  await clickButton('Next', '/authenticate');

  await verifyUserInfo(page, expect);
});
