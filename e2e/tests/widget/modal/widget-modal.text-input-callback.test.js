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

async function runTextInputFlow(page, callbackPayload, submittedValue, assertionFn) {
  const { clickButton, navigate } = asyncEvents(page);
  let authenticateRequestCount = 0;

  await page.route('**/authenticate**', async (route) => {
    authenticateRequestCount += 1;

    if (authenticateRequestCount === 1) {
      await route.fulfill({
        status: 200,
        json: {
          authId: 'mock-text-input-auth-id',
          callbacks: [callbackPayload],
        },
      });
      return;
    }

    const requestData = route.request().postDataJSON();
    if (assertionFn) {
      assertionFn(requestData);
    }
    expect(requestData.callbacks[0].input[0].value).toBe(submittedValue);

    await route.fulfill({
      status: 200,
      json: {
        authId: 'mock-text-output-auth-id',
        callbacks: [
          {
            type: 'TextOutputCallback',
            output: [
              { name: 'message', value: 'Text input callback submitted.' },
              { name: 'messageType', value: '0' },
            ],
            _id: 1,
          },
        ],
      },
    });
  });

  await navigate('widget/modal?journey=TEST_Login');
  await clickButton('Open Login Modal', '/authenticate');

  return { clickButton };
}

test('Modal widget with TextInputCallback', async ({ page }) => {
  const submittedValue = 'test text-input callback value';
  const { clickButton } = await runTextInputFlow(
    page,
    {
      type: 'TextInputCallback',
      output: [{ name: 'prompt', value: 'Security answer' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
    submittedValue,
  );

  const textInput = page.getByLabel('Security answer');
  await expect(textInput).toBeVisible();
  await textInput.fill(submittedValue);

  await clickButton('Next', '/authenticate');

  await expect(page.getByText('Text input callback submitted.')).toBeVisible();
});

test('Modal TextInputCallback uses fallback label when prompt is empty', async ({ page }) => {
  const submittedValue = 'fallback prompt submission';
  const { clickButton } = await runTextInputFlow(
    page,
    {
      type: 'TextInputCallback',
      output: [{ name: 'prompt', value: '' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
    submittedValue,
  );

  const textInput = page.getByRole('textbox', { name: /text input callback/i });
  await expect(textInput).toBeVisible();
  await textInput.fill(submittedValue);

  await clickButton('Next', '/authenticate');
  await expect(page.getByText('Text input callback submitted.')).toBeVisible();
});

test('Modal TextInputCallback supports prefilled value and overwrite on submit', async ({
  page,
}) => {
  const prefilledValue = 'existing answer';
  const submittedValue = 'new answer';
  const { clickButton } = await runTextInputFlow(
    page,
    {
      type: 'TextInputCallback',
      output: [{ name: 'prompt', value: 'Security answer' }],
      input: [{ name: 'IDToken1', value: prefilledValue }],
      _id: 0,
    },
    submittedValue,
  );

  const textInput = page.getByLabel('Security answer');
  await expect(textInput).toBeVisible();
  await expect(textInput).toHaveValue(prefilledValue);
  await textInput.fill(submittedValue);

  await clickButton('Next', '/authenticate');
  await expect(page.getByText('Text input callback submitted.')).toBeVisible();
});

test('Modal TextInputCallback normalizes non-string input to empty render value', async ({
  page,
}) => {
  const submittedValue = 'value after non-string input';
  const { clickButton } = await runTextInputFlow(
    page,
    {
      type: 'TextInputCallback',
      output: [{ name: 'prompt', value: 'Security answer' }],
      input: [{ name: 'IDToken1', value: 42 }],
      _id: 0,
    },
    submittedValue,
    (requestData) => {
      expect(typeof requestData.callbacks[0].input[0].value).toBe('string');
    },
  );

  const textInput = page.getByLabel('Security answer');
  await expect(textInput).toBeVisible();
  await expect(textInput).toHaveValue('');
  await textInput.fill(submittedValue);

  await clickButton('Next', '/authenticate');
  await expect(page.getByText('Text input callback submitted.')).toBeVisible();
});
