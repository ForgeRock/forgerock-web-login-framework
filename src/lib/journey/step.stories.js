import { FRStep } from '@forgerock/javascript-sdk';
import { writable } from 'svelte/store';

import Step from './step.story.svelte';
import { loginStep, registrationStep } from './step.mock';

const frRegistrationStep = new FRStep(registrationStep);
const frLoginStep = new FRStep(loginStep);

export default {
  argTypes: {
    step: { control: false },
    submitForm: { control: false },
  },
  component: Step,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Journey/Step',
};

export const Login = {
  args: {
    step: writable(frLoginStep),
    submitForm: () => {
      console.log('Form submitted.');
    },
  },
};
export const Registration = {
  args: {
    step: writable(frRegistrationStep),
    submitForm: () => {
      console.log('Form submitted.');
    },
  },
};
