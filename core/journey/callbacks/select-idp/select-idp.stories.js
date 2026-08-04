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
import {
  singleLinkedInProviderStep,
  singleMicrosoftProviderStep,
  singleProviderNoLocalAuthStep,
} from './select-idp.mock';
import Input from './select-idp.story.svelte';

const singleProviderNoLocalAuth = createJourneyStep(singleProviderNoLocalAuthStep);
const singleLinkedInProvider = createJourneyStep(singleLinkedInProviderStep);
const singleMicrosoftProvider = createJourneyStep(singleMicrosoftProviderStep);

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

export const LinkedIn = {
  args: {
    socialCallback: singleLinkedInProvider.getCallbackOfType(callbackType.SelectIdPCallback),
    localAuth: false,
  },
};

export const Microsoft = {
  args: {
    socialCallback: singleMicrosoftProvider.getCallbackOfType(callbackType.SelectIdPCallback),
    localAuth: false,
  },
};
