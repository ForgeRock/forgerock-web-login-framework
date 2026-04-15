/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';
import { within, userEvent } from 'storybook/test';
import { expect } from 'storybook/test';

import step from './string-attribute-input.mock';
import Input from './string-attribute-input.story.svelte';

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/StringAttributeInput',
};

export const Base = {
  args: {
    callback: step.getCallbacksOfType(callbackType.StringAttributeInputCallback)[0],
  },
};

export const Email = {
  args: {
    callback: step.getCallbacksOfType(callbackType.StringAttributeInputCallback)[1],
  },
};

export const Error = {
  args: {
    callback: step.getCallbacksOfType(callbackType.StringAttributeInputCallback)[2],
  },
};

export const Interaction = {
  args: { ...Base.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cb = step.getCallbacksOfType(callbackType.StringAttributeInputCallback)[0];
    const input = canvas.getByLabelText('First name');

    await userEvent.tab();
    expect(input).toHaveFocus();

    await userEvent.type(input, 'username');
    await userEvent.tab();

    expect(cb.getInputValue()).toBe('username');
  },
};
