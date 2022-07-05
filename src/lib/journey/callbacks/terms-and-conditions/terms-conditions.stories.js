import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import response from './terms-conditions.mock';
import Input from './terms-conditions.story.svelte';

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
  title: 'Callbacks/TermsAndConditions',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.TermsAndConditionsCallback),
    inputName: 'termsAndConditionsCallback',
  },
};
