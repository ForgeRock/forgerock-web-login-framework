import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import response from './name.mock';
import Input from './name.story.svelte';

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
  title: 'Callbacks/Name',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.NameCallback),
    inputName: 'nameCallback',
  },
};
