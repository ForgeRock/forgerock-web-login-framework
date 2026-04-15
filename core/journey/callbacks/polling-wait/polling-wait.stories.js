/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';
import { expect, fn } from 'storybook/test';
import { within } from 'storybook/test';

import step from './polling-wait.mock';
import PollingWait from './polling-wait.story.svelte';

export default {
  argTypes: {
    callback: { control: false },
  },
  component: PollingWait,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/PollingWait',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(callbackType.PollingWaitCallback),
    selfSubmitFunction: fn(),
  },
};

export const Interaction = {
  args: { ...Base.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(Base.args.selfSubmitFunction).not.toBeCalled();

    const callback = step.getCallbackOfType(callbackType.PollingWaitCallback);
    const message = callback.getMessage();
    const time = callback.getWaitTime();

    await expect(canvas.getByText(message)).toBeInTheDocument();

    await new Promise((resolve) => setTimeout(resolve, time + 1000));
    await expect(Base.args.selfSubmitFunction).toBeCalled();
  },
};
