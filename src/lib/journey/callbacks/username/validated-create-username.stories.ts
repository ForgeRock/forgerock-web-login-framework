import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import response from './validated-create-username.mock';
import Input from './validated-create-username.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
    inputName: { control: false },
    showError: { control: 'boolean' },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/ValidatedCreateUsername',
};

export const Base = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.ValidatedCreateUsernameCallback)[0],
    inputName: 'usernameCallback',
  },
};

export const Error = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.ValidatedCreateUsernameCallback)[1],
    inputName: 'usernameCallback',
  },
};
