import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import response from './string-attribute-input.mock';
import Input from './string-attribute-input.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/StringAttributeInput',
};

export const Base = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.StringAttributeInputCallback)[0],
  },
};

export const Email = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.StringAttributeInputCallback)[1],
  },
};

export const Error = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.StringAttributeInputCallback)[2],
  },
};
