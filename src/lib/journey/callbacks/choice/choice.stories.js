import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import response from './choice.mock';
import Input from './choice.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/Choice',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.ChoiceCallback),
  },
};
