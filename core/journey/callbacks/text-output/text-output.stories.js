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

import step from './text-output.mock';
import TextOutput from './text-output.story.svelte';

export default {
  argTypes: {
    callback: { control: false },
    inputName: { control: false },
  },
  component: TextOutput,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/TextOutput',
};

export const Base = {
  args: {
    callback: step.getCallbacksOfType(callbackType.TextOutputCallback)[0],
  },
};

export const WithHTML = {
  args: {
    callback: step.getCallbacksOfType(callbackType.TextOutputCallback)[1],
  },
};

export const WithScript = {
  args: {
    callback: step.getCallbacksOfType(callbackType.TextOutputCallback)[2],
  },
};

export const Warning = {
  args: {
    callback: step.getCallbacksOfType(callbackType.TextOutputCallback)[3],
  },
};

export const Error = {
  args: {
    callback: step.getCallbacksOfType(callbackType.TextOutputCallback)[4],
  },
};
export const Suspended = {
  args: {
    callback: step.getCallbacksOfType(callbackType.SuspendedTextOutputCallback)[0],
  },
};

export const Interaction = {
  args: { ...WithHTML.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // This essentially just tests whether the HTML renders the link as a valid element
    await expect(canvas.getByText('privacy policy')).toBeTruthy();
  },
};
