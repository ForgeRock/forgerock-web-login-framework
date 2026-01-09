/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { userEvent, within } from 'storybook/test';
import { expect } from 'storybook/test';

import response from './name.mock';
import Input from './name.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/Name',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.NameCallback),
  },
};

export const Interaction = {
  args: { ...Base.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cb = step.getCallbackOfType(CallbackType.NameCallback);
    const element = canvas.getByRole('textbox');
    await userEvent.type(element, 'input here');
    await userEvent.tab();
    expect(cb.getInputValue()).toBe('input here');
  },
};
