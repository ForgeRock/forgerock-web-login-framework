/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { fn } from 'storybook/test';
import { writable } from 'svelte/store';

import { createJourneyStep } from '$journey/_utilities/step.mock';
import { initialize } from '$journey/config.store';
import { registrationStep } from '$journey/stages/step.mock';
import Step from './style.story.svelte';
const frRegistrationStep = createJourneyStep(registrationStep);

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
      restart: fn(),
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
      restart: fn(),
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
      restart: fn(),
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
      restart: fn(),
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

export const ThemeOverride = {
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
      restart: fn(),
      stack: writable([]),
    },
    stage: '',
    step: frRegistrationStep,
    style: {
      theme: {
        primaryColor: '#cc0000',
        buttonBorderRadius: 20,
        cardBorderRadius: 16,
      },
    },
  },
};
