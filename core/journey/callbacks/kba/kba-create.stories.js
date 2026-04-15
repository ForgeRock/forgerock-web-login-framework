/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';
import { userEvent, within } from 'storybook/test';
import { expect } from 'storybook/test';

import step from './kba-create.mock';
import Input from './kba-create.story.svelte';

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/KbaCreate',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(callbackType.KbaCreateCallback),
  },
};

export const Interaction = {
  args: { ...Base.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const cb = step.getCallbackOfType(callbackType.KbaCreateCallback);

    await userEvent.tab();

    const selectEl = canvas.getByLabelText('Select a security question', {
      selector: 'select',
    });
    await userEvent.selectOptions(selectEl, '0', { delay: 100 });

    await expect(canvas.queryByLabelText('Custom security question')).toBeNull();

    await userEvent.tab();

    const answerEl = canvas.getByLabelText('Security answer', {
      selector: 'input',
    });

    await userEvent.type(answerEl, 'Red', {
      delay: 200,
    });

    await userEvent.selectOptions(selectEl, '2', { delay: 100 });

    await userEvent.tab();

    await expect(canvas.queryByLabelText('Custom security question')).toBeVisible();

    const questionEl = canvas.getByLabelText('Custom security question', {
      selector: 'input',
    });

    await userEvent.type(questionEl, 'Favorite food?', {
      delay: 200,
    });

    await userEvent.clear(answerEl);
    await userEvent.type(answerEl, 'Tacos', {
      delay: 200,
    });

    await userEvent.selectOptions(selectEl, '1', { delay: 100 });

    expect(cb.getInputValue()).toBe('1');
    expect(cb.payload.input[1].value).toBe('Tacos');

    await expect(canvas.queryByLabelText('Custom security question')).toBeNull();

    await userEvent.clear(answerEl);
  },
};
