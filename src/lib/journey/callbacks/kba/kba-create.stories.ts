import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import response from './kba-create.mock';
import Input from './kba-create.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
    inputName: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/KbaCreate',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.KbaCreateCallback),
    inputName: 'passwordCallback',
  },
};
