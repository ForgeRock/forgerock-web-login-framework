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

test('Modal widget prints scripted text output by default', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  // Navigate to page without Widget instantiation
  await navigate('widget');

  const loginLink = page.getByRole('link', { name: 'Login via Modal Widget' });

  await expect(loginLink).toBeVisible();

  await navigate('widget/modal?journey=TEST_ScriptTextOutput');

  await expect(page.getByRole('dialog')).toBeHidden();

  await clickButton('Open Login Modal', '/authenticate');

  await expect(page.getByRole('dialog')).toBeVisible();

  await expect(page.getByText('TextOutput Type 0 (INFO)')).toBeVisible();
  await expect(page.getByText('TextOutput Type 1 (WARNING)')).toBeVisible();
  await expect(page.getByText('TextOutput Type 2 (ERROR)')).toBeVisible();
  await expect(page.getByText('TextOutput Type 4 (SCRIPT)')).toBeVisible();
});

test('Modal widget hides scripted text output when configured', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  // Navigate to page without Widget instantiation
  await navigate('widget');

  const loginLink = page.getByRole('link', { name: 'Login via Modal Widget' });

  await expect(loginLink).toBeVisible();

  await navigate('widget/modal?journey=TEST_ScriptTextOutput&hideScriptedTextOutput=true');

  await expect(page.getByRole('dialog')).toBeHidden();

  await clickButton('Open Login Modal', '/authenticate');

  await expect(page.getByRole('dialog')).toBeVisible();

  await expect(page.getByText('TextOutput Type 0 (INFO)')).toBeVisible();
  await expect(page.getByText('TextOutput Type 1 (WARNING)')).toBeVisible();
  await expect(page.getByText('TextOutput Type 2 (ERROR)')).toBeVisible();
  await expect(page.getByText('TextOutput Type 4 (SCRIPT)')).toBeHidden();
});
