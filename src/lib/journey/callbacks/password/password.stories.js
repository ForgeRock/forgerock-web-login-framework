import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import response from './password.mock';
import Input from './password.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/Password',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.PasswordCallback),
  },
};
