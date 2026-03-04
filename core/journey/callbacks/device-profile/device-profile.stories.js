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
import { FRDevice } from '@forgerock/javascript-sdk';
import { deviceProfileMockNoMessage, deviceProfileMockMessage } from './device-profile.mock';
import DeviceProfile from './device-profile.story.svelte';
import { within } from 'storybook/test';

const stepWithNoMessage = new FRStep(deviceProfileMockNoMessage);
const stepWithMessage = new FRStep(deviceProfileMockMessage);

export default {
  argTypes: {
    callback: { control: false },
    displayType: {
      control: { type: 'text' },
    },
  },
  component: DeviceProfile,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/DeviceProfile',
};

export const Base = {
  args: {
    callback: stepWithNoMessage.getCallbackOfType(CallbackType.DeviceProfileCallback),
  },
};
export const WithMessage = {
  args: {
    callback: stepWithMessage.getCallbackOfType(CallbackType.DeviceProfileCallback),
  },
};
export const Interaction = {
  args: {
    ...Base.args,
    callback: stepWithMessage.getCallbackOfType(CallbackType.DeviceProfileCallback),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const device = new FRDevice({});
    const cb = stepWithMessage.getCallbackOfType(CallbackType.DeviceProfileCallback);

    const msg = canvas.getByText('This is a message');
    await expect(msg).toBeInTheDocument();
    await Promise.resolve(() => {
      console.log('waiting for device profile to be gathered');
    }, 5000);

    const location = cb.isLocationRequired();
    const metadata = cb.isMetadataRequired();

    const deviceProfile = await device.getProfile({ location, metadata });
    expect(deviceProfile.identifier).toBeTruthy();
  },
};
