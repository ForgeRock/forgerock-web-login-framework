import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import response from './hidden-value.mock';
import Input from './hidden-value.story.svelte';

const step = new FRStep(response);

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
    callback: step.getCallbackOfType(CallbackType.HiddenValueCallback),
  },
};
