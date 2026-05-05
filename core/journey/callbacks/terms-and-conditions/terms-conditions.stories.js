/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';
import { expect } from 'storybook/test';
import { userEvent, within } from 'storybook/test';

import step from './terms-conditions.mock';
import Input from './terms-conditions.story.svelte';

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
    callback: step.getCallbackOfType(callbackType.TermsAndConditionsCallback),
  },
};
export const Interaction = {
  args: { ...Base.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cb = step.getCallbackOfType(callbackType.TermsAndConditionsCallback);
    const element = canvas.getByRole('checkbox');
    await userEvent.click(element);
    await userEvent.tab();
    expect(cb.getInputValue()).toBe(true);
  },
};
