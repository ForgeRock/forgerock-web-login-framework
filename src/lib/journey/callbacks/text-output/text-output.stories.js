import { screen, userEvent } from '@storybook/testing-library';
import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import response from './text-output.mock';
import TextOutput from './text-output.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
    inputName: { control: false },
  },
  component: TextOutput,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/TextOutput',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.TextOutputCallback),
    choice: step.getCallbackOfType(CallbackType.ConfirmationCallback),
  },
  play : async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));

  await userEvent.tab();

  const yes = screen.getByText('Yes');

  await userEvent.tab();

  await userEvent.click(yes);

  const no = screen.getByText('No');
  await userEvent.click(no);

  await userEvent.tab();
  }
};

