import { FRStep } from '@forgerock/javascript-sdk';

import Step from './stages.story.svelte';
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
    stage: 'UsernamePassword',
    step: frLoginStep,
    submitForm: () => {
      console.log('Form submitted.');
    },
  },
};
export const Registration = {
  args: {
    stage: 'Registration',
    step: frRegistrationStep,
    submitForm: () => {
      console.log('Form submitted.');
    },
  },
};
