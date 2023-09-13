import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import response from './redirect.mock';
import Input from './redirect.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/Redirect',
};

export const Base = {
  args: {
    step: step,
    callback: step.getCallbackOfType(CallbackType.RedirectCallback),
  },
};
