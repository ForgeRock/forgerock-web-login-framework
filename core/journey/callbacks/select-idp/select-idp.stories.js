/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import { singleProviderNoLocalAuthStep } from './select-idp.mock';
import Input from './select-idp.story.svelte';

const singleProviderNoLocalAuth = new FRStep(singleProviderNoLocalAuthStep);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/SelectIdp',
};

export const Base = {
  args: {
    socialCallback: singleProviderNoLocalAuth.getCallbackOfType(CallbackType.SelectIdPCallback),
    localAuth: true,
  },
};
