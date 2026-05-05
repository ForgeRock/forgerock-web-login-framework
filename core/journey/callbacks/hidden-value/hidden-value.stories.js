/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';

import step from './hidden-value.mock';
import Input from './hidden-value.story.svelte';

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/HiddenValue',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(callbackType.HiddenValueCallback),
  },
};
