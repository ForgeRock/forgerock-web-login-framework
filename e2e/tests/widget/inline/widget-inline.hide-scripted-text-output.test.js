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

test('Inline widget prints scripted text output by default', async ({ page }) => {
  const { navigate } = asyncEvents(page);

  // The journey's entry node is the scripted decision itself, so the callbacks render
  // as soon as the widget starts the journey on mount — no credentials step in between.
  await navigate('widget/inline?journey=TEST_ScriptTextOutput');

  await expect(page.getByText('TextOutput Type 0 (INFO)')).toBeVisible();
  await expect(page.getByText('TextOutput Type 1 (WARNING)')).toBeVisible();
  await expect(page.getByText('TextOutput Type 2 (ERROR)')).toBeVisible();
  await expect(page.getByText('TextOutput Type 4 (SCRIPT)')).toBeVisible();
});

test('Inline widget hides scripted text output when configured', async ({ page }) => {
  const { navigate } = asyncEvents(page);

  await navigate('widget/inline?journey=TEST_ScriptTextOutput&hideScriptedTextOutput=true');

  await expect(page.getByText('TextOutput Type 0 (INFO)')).toBeVisible();
  await expect(page.getByText('TextOutput Type 1 (WARNING)')).toBeVisible();
  await expect(page.getByText('TextOutput Type 2 (ERROR)')).toBeVisible();
  await expect(page.getByText('TextOutput Type 4 (SCRIPT)')).toBeHidden();
});
