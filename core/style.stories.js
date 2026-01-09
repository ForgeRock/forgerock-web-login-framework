/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { FRStep } from '@forgerock/javascript-sdk';
import { fn } from 'storybook/test';
import { writable } from 'svelte/store';

import { initialize } from '$journey/config.store';
import Step from './style.story.svelte';
import { registrationStep } from '$journey/stages/step.mock';
const frRegistrationStep = new FRStep(registrationStep);

initialize();

export default {
  argTypes: {
    form: { control: false },
    journey: { control: false },
    stage: { control: false },
    stageJson: { control: false },
    step: { control: false },
    style: { control: false },
    submitForm: { control: false },
  },
  component: Step,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Style/Config',
};

export const Defaults = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: fn(),
    },
    journey: {
      loading: false,
      pop: fn(),
      push: fn(),
      stack: writable([]),
    },
    stage: '',
    step: frRegistrationStep,
  },
};

export const StackedLabels = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: fn(),
    },
    journey: {
      loading: false,
      pop: fn(),
      push: fn(),
      stack: writable([]),
    },
    stage: '',
    step: frRegistrationStep,
    style: {
      labels: 'stacked',
    },
  },
};

export const AnimatedChecksRadios = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: fn(),
    },
    journey: {
      loading: false,
      pop: fn(),
      push: fn(),
      stack: writable([]),
    },
    stage: '',
    stageJson: {
      themeId: 'zardoz',
      ChoiceCallback: [{ id: 'subNode1', displayType: 'radio' }],
    },
    step: frRegistrationStep,
    style: {
      checksAndRadios: 'animated',
    },
  },
};

export const StandardChecksRadios = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: fn(),
    },
    journey: {
      loading: false,
      pop: fn(),
      push: fn(),
      stack: writable([]),
    },
    stage: '',
    stageJson: {
      themeId: 'zardoz',
      ChoiceCallback: [{ id: 'subNode1', displayType: 'radio' }],
    },
    step: frRegistrationStep,
    style: {
      checksAndRadios: 'standard',
    },
  },
};
