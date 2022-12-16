import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import { singleProviderNoLocalAuthStep } from './select-idp.mock';
import Input from './select-idp.story.svelte';

const singleProviderNoLocalAuth = new FRStep(singleProviderNoLocalAuthStep);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/SelectIdp',
};

export const Base = {
  args: {
    socialCallback: singleProviderNoLocalAuth.getCallbackOfType(CallbackType.SelectIdPCallback),
    localAuth: true,
  },
};
