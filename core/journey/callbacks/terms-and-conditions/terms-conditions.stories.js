/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { expect } from 'storybook/test';
import { userEvent, within } from 'storybook/test';

import response from './terms-conditions.mock';
import Input from './terms-conditions.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/TermsAndConditions',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.TermsAndConditionsCallback),
  },
};
export const Interaction = {
  args: { ...Base.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cb = step.getCallbackOfType(CallbackType.TermsAndConditionsCallback);
    const element = canvas.getByRole('checkbox');
    await userEvent.click(element);
    await userEvent.tab();
    expect(cb.getInputValue()).toBe(true);
  },
};
