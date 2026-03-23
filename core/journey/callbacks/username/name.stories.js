/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';
import { userEvent, within } from 'storybook/test';
import { expect } from 'storybook/test';

import step from './name.mock';
import Input from './name.story.svelte';

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
    callback: step.getCallbackOfType(callbackType.NameCallback),
  },
};

export const PasskeyAutofill = {
  args: {
    ...Base.args,
    isPasskeyAutofillEligible: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const element = canvas.getByRole('textbox');
    await expect(element).toHaveAttribute('autocomplete', 'username webauthn');
  },
};

export const Interaction = {
  args: { ...Base.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cb = step.getCallbackOfType(callbackType.NameCallback);
    const element = canvas.getByRole('textbox');
    await userEvent.type(element, 'input here');
    await userEvent.tab();
    expect(cb.getInputValue()).toBe('input here');
  },
};
