import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import response from './boolean.mock';
import Checkbox from './boolean.story.svelte';

const step = new FRStep(response);

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
    callback: step.getCallbacksOfType(CallbackType.BooleanAttributeInputCallback)[0],
  },
};

export const Error = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.BooleanAttributeInputCallback)[1],
  },
};
