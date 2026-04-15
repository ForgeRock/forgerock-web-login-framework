/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';

import step from './redirect.mock';
import Input from './redirect.story.svelte';

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/Redirect',
};

export const Base = {
  args: {
    step: step,
    callback: step.getCallbackOfType(callbackType.RedirectCallback),
  },
};
