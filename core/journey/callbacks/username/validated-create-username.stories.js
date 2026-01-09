/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { within, userEvent } from 'storybook/test';
import { expect } from 'storybook/test';

import response from './validated-create-username.mock';
import Input from './validated-create-username.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/ValidatedCreateUsername',
};
export const Base = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.ValidatedCreateUsernameCallback)[0],
  },
};

export const Error = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.ValidatedCreateUsernameCallback)[1],
  },
};

export const Interaction = {
  args: { ...Base.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cb = step.getCallbacksOfType(CallbackType.ValidatedCreateUsernameCallback)[0];
    await userEvent.tab();
    const input = canvas.getByLabelText('Username');
    expect(input).toHaveFocus();

    await userEvent.type(input, 'username');
    await userEvent.tab();

    expect(cb.getInputValue()).toBe('username');
  },
};
