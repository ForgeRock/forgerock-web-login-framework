import { screen, userEvent } from '@storybook/testing-library';
import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import response from './suspend-text-output.mock';
import SuspendTextOutput from './suspend-text-output.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
    inputName: { control: false },
  },
  component: SuspendTextOutput,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/SuspendTextOutput',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.SuspendedTextOutputCallback),
  },
};

