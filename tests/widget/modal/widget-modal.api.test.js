import { expect, test } from '@playwright/test';

import { asyncEvents } from '../../utilities/async-events.js';

test('Widget API events', async ({ page }) => {
  const messageArray = [];

  // Listen for events on page
  page.on('console', async (msg) => {
    return messageArray.push(msg.text());
  });

  const { clickButton, navigate } = asyncEvents(page);

  await navigate('widget/modal?journey=TEST_Login');

  await expect(page.getByRole('dialog')).toBeHidden();

  await clickButton('Open Login Modal', '/authenticate');

  // Modal open()
  await expect(page.getByRole('dialog')).toBeVisible();

  // Modal close()
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

  // Modal onMount()
  expect(messageArray.includes('Modal mounted')).toBe(true);

  // Modal onClose()
  expect(messageArray.includes('Modal closed due to user')).toBe(true);
});
