import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { writable } from 'svelte/store';

import Step from './step.svelte';
import { loginStep, registrationStep } from './step.mock';

const frRegistrationStep = new FRStep(registrationStep);
const frLoginStep = new FRStep(loginStep);

export default {
  component: Step,
  title: 'Journey/Step',
  argTypes: {},
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
