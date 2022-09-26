import { FRStep } from '@forgerock/javascript-sdk';

import Step from './stages.story.svelte';
import { loginStep, registrationStep, usernamePasswordStep } from './step.mock';

const frRegistrationStep = new FRStep(registrationStep);
const frLoginStep = new FRStep(loginStep);
const frUsernamePasswordStep = new FRStep(usernamePasswordStep);

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

export const Generic = {
  args: {
    displayIcon: true,
    failureMessage: '',
    stage: frLoginStep.getStage(),
    step: frLoginStep,
    submitForm: () => {
      console.log('Form submitted.');
    },
  },
};
export const Registration = {
  args: {
    displayIcon: true,
    failureMessage: '',
    stage: frRegistrationStep.getStage(),
    step: frRegistrationStep,
    submitForm: () => {
      console.log('Form submitted.');
    },
  },
};
export const UsernamePassword = {
  args: {
    displayIcon: true,
    failureMessage: '',
    labelType: 'stacked',
    stage: frUsernamePasswordStep.getStage(),
    step: frUsernamePasswordStep,
    submitForm: () => {
      console.log('Form submitted.');
    },
  },
};
