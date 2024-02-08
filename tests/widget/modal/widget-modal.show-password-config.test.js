import { expect, test } from '@playwright/test';

import { asyncEvents } from '../../utilities/async-events.js';

test('Modal widget with show password checkbox', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  const messageArray = [];

  // Listen for events on page
  page.on('console', async (msg) => {
    return messageArray.push(msg.text());
  });

  // Navigate to page without Widget instantiation
  await navigate('widget');

  const loginLink = page.getByRole('link', { name: 'Login via Modal Widget' });

  await expect(loginLink).toBeVisible();

  await navigate('widget/modal?journey=TEST_Login&showPassword=checkbox');

  await expect(page.getByRole('dialog')).toBeHidden();

  await clickButton('Open Login Modal', '/authenticate');

  await expect(page.getByRole('dialog')).toBeVisible();

  await expect(page.getByRole('checkbox')).toBeVisible();
});

test('Modal widget with show password button', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  const messageArray = [];

  // Listen for events on page
  page.on('console', async (msg) => {
    return messageArray.push(msg.text());
  });

  // Navigate to page without Widget instantiation
  await navigate('widget');

  const loginLink = page.getByRole('link', { name: 'Login via Modal Widget' });

  await expect(loginLink).toBeVisible();

  await navigate('widget/modal?journey=TEST_Login&showPassword=button');

  await expect(page.getByRole('dialog')).toBeHidden();

  await clickButton('Open Login Modal', '/authenticate');

  await expect(page.getByRole('dialog')).toBeVisible();

  await expect(page.getByRole('button', { name: 'Show password' })).toBeVisible();
});

test('Modal widget with fallback show password config', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  const messageArray = [];

  // Listen for events on page
  page.on('console', async (msg) => {
    return messageArray.push(msg.text());
  });

  // Navigate to page without Widget instantiation
  await navigate('widget');

  const loginLink = page.getByRole('link', { name: 'Login via Modal Widget' });

  await expect(loginLink).toBeVisible();

  await navigate('widget/modal?journey=TEST_Login');

  await expect(page.getByRole('dialog')).toBeHidden();

  await clickButton('Open Login Modal', '/authenticate');

  await expect(page.getByRole('dialog')).toBeVisible();

  await expect(page.getByRole('button', { name: 'Show password' })).toBeVisible();
});

test('Modal widget with none show password config', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  const messageArray = [];

  // Listen for events on page
  page.on('console', async (msg) => {
    return messageArray.push(msg.text());
  });

  // Navigate to page without Widget instantiation
  await navigate('widget');

  const loginLink = page.getByRole('link', { name: 'Login via Modal Widget' });

  await expect(loginLink).toBeVisible();

  await navigate('widget/modal?journey=TEST_Login&showPassword=none');

  await expect(page.getByRole('dialog')).toBeHidden();

  await clickButton('Open Login Modal', '/authenticate');

  await expect(page.getByRole('dialog')).toBeVisible();

  await expect(page.getByRole('button', { name: 'Show password' })).toBeHidden();
  await expect(page.getByRole('checkbox')).toBeHidden();
});
