/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';

import { createJourneyStep } from '$journey/_utilities/step.mock';
import { singleProviderNoLocalAuthStep } from './select-idp.mock';
import Input from './select-idp.story.svelte';

const singleProviderNoLocalAuth = createJourneyStep(singleProviderNoLocalAuthStep);

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
    socialCallback: singleProviderNoLocalAuth.getCallbackOfType(callbackType.SelectIdPCallback),
    localAuth: true,
  },
};
