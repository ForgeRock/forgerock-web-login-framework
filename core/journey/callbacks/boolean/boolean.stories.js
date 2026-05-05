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
import { within } from 'storybook/test';

import step from './boolean.mock';
import Checkbox from './boolean.story.svelte';

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
    callback: step.getCallbacksOfType(callbackType.BooleanAttributeInputCallback)[0],
  },
};

export const Error = {
  args: {
    callback: step.getCallbacksOfType(callbackType.BooleanAttributeInputCallback)[1],
  },
};
export const Interaction = {
  args: {
    ...Base.args,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const check = canvas.getByRole('checkbox');

    const cb = step.getCallbacksOfType(callbackType.BooleanAttributeInputCallback)[0];

    expect(check).not.toBeChecked();
    check.click();
    expect(check).toBeChecked();
    expect(cb.getInputValue()).toBe(true);
  },
};
