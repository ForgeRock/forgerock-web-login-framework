/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';
import { userEvent, within } from 'storybook/test';
import { expect } from 'storybook/test';

import step from './text-input.mock';
import Input from './text-input.story.svelte';

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/TextInput',
};

export const Base = {
  args: {
    callback: step.getCallbacksOfType(callbackType.TextInputCallback)[0],
  },
};

export const Prefilled = {
  args: {
    callback: step.getCallbacksOfType(callbackType.TextInputCallback)[1],
  },
};

export const Interaction = {
  args: { ...Base.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cb = step.getCallbacksOfType(callbackType.TextInputCallback)[0];
    const input = canvas.getByLabelText('Security answer');

    await userEvent.tab();
    expect(input).toHaveFocus();

    await userEvent.type(input, 'my storybook text');
    await userEvent.tab();

    expect(cb.getInputValue()).toBe('my storybook text');
  },
};
