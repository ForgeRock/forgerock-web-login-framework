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
import { password, username } from '../../utilities/demo-user.js';

test('Modal widget with simple login and misc callbacks', async ({ page }) => {
  const { clickButton, navigate } = asyncEvents(page);

  // TODO update this to a new TEST_ journey once finished
  await navigate('widget/modal?journey=TEST_LoginWithMiscCallbacks');

  await clickButton('Open Login Modal', '/authenticate');

  // Username
  await page.getByLabel('Username').fill(username);
  await clickButton('Next', '/authenticate');

  // Password
  await page.getByLabel('Password').fill(password);
  await clickButton('Next', '/authenticate');

  // Confirmation
  await expect(page.getByText('Are you human?')).toBeVisible();
  await clickButton('Yes', '/authenticate'); // <- Self submitting callback

  // Choice (select)
  const selectEl = page.getByLabel('Are you sure?');
  await selectEl.selectOption('0');
  await clickButton('Next', '/authenticate');

  // Choice (radio)
  // TODO: The below selector should distinguish between the select and radio types
  await expect(page.getByText('Are you sure?')).toBeVisible();
  // TODO: Figure out why regular clicks don't work: https://github.com/microsoft/playwright/issues/13576
  await page.getByLabel('Yes').dispatchEvent('click');
  await clickButton('Next', '/authenticate');

  await expect(page.getByRole('status')).toBeVisible();
  await verifyUserInfo(page, expect);
});

test('Modal widget with consecutive choice callbacks shows default on second step', async ({
  page,
}) => {
  const { clickButton, navigate } = asyncEvents(page);

  await navigate('widget/modal?journey=TEST_ConsecutiveChoiceCallbacks');

  await clickButton('Open Login Modal', '/authenticate');

  // First choice step: select the last option (test4)
  const firstSelect = page.locator('select').first();
  await expect(firstSelect).toBeVisible();
  await firstSelect.selectOption({ label: 'test4' });
  await clickButton('Next', '/authenticate');

  // Second choice step: select must show the AM default, not the previous selection
  const secondSelect = page.locator('select').last();
  await expect(secondSelect).toBeVisible();
  await expect(secondSelect).toHaveValue('1');
});

// Regression: all four fixed callbacks in one journey (TEST_ConsecutiveCallbacks).
// Each renders twice in a row; the second of each pair must show fresh state.
test('Modal widget with consecutive callbacks of every fixed type resets state', async ({
  page,
}) => {
  const { clickButton, navigate } = asyncEvents(page);

  await navigate('widget/modal?journey=TEST_ConsecutiveCallbacks');

  await clickButton('Open Login Modal', '/authenticate');

  // Login
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await clickButton('Next', '/authenticate');

  // Choice pair: step 2 must show the AM default (test2), not step 1's pick
  await page.locator('select').first().selectOption({ label: 'test4' });
  await clickButton('Next', '/authenticate');
  await expect(page.locator('select').last()).toHaveValue('1');
  await clickButton('Next', '/authenticate');

  // KBA pair: step 2's answer field and question dropdowns must be reset
  // (the KBA node asks two questions per step - pick question and answer for both)
  const questionDropdowns = page.getByLabel('Select a security question.');
  const answerFields = page.getByLabel('Security answer');
  await questionDropdowns.first().selectOption({ index: 1 });
  await answerFields.first().fill('step-one-answer-a');
  await questionDropdowns.last().selectOption({ index: 2 });
  await answerFields.last().fill('step-one-answer-b');
  await clickButton('Next', '/authenticate');
  await expect(questionDropdowns.first()).toHaveValue('');
  await expect(answerFields.first()).toHaveValue('');
  await expect(answerFields.last()).toHaveValue('');

  // Second KBA step: fill and continue
  await questionDropdowns.first().selectOption({ index: 1 });
  await answerFields.first().fill('step-two-answer-a');
  await questionDropdowns.last().selectOption({ index: 2 });
  await answerFields.last().fill('step-two-answer-b');
  await clickButton('Next', '/authenticate');

  // Confirmation pair: self-submitting Yes buttons; wait for each step to advance
  await clickButton('Yes', '/authenticate');
  await expect(page.getByText('Consecutive confirmation 2')).toBeVisible();
  await clickButton('Yes', '/authenticate');
  await expect(page.getByRole('checkbox')).toBeVisible();

  // Terms pair: second checkbox must start unchecked
  // getByLabel/check() don't work on the animated checkbox - click the label text
  await page.getByText('Please accept our Terms & Conditions').click();
  await clickButton('Next', '/authenticate');
  await expect(page.getByRole('checkbox')).toBeVisible();
  await expect(page.getByRole('checkbox')).not.toBeChecked();

  await page.getByText('Please accept our Terms & Conditions').click();
  await clickButton('Next', '/authenticate');

  await expect(page.getByRole('status')).toBeVisible();
});
