import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import response from './validated-create-password.mock';
import Input from './validated-create-password.story.svelte';

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
  title: 'Callbacks/ValidatedCreatePassword',
};

export const Base = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.ValidatedCreatePasswordCallback)[0],
    inputName: 'passwordCallback',
  },
};

export const Error = {
  args: {
    showError: true,
    callback: step.getCallbacksOfType(CallbackType.ValidatedCreatePasswordCallback)[1],
    inputName: 'passwordCallbackWithError',
  },
};
