/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect } from 'storybook/test';
import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { within } from 'storybook/test';

import response from './boolean.mock';
import Checkbox from './boolean.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Checkbox,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/BooleanAttributeInput',
};

export const Base = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.BooleanAttributeInputCallback)[0],
  },
};

export const Error = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.BooleanAttributeInputCallback)[1],
  },
};
export const Interaction = {
  args: {
    ...Base.args,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const check = canvas.getByRole('checkbox');

    const cb = step.getCallbacksOfType(CallbackType.BooleanAttributeInputCallback)[0];

    expect(check).not.toBeChecked();
    check.click();
    expect(check).toBeChecked();
    expect(cb.getInputValue()).toBe(true);
  },
};
