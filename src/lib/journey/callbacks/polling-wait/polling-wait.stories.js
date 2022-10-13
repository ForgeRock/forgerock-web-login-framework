import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { expect, jest } from '@storybook/jest';
import { within } from '@storybook/testing-library';

import response from './polling-wait.mock';
import PollingWait from './polling-wait.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: PollingWait,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/PollingWait',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.PollingWaitCallback),
    callbackMetadata: {
      isFirstInvalidInput: false,
      isReadyForSubmission: false,
      isSelfSubmittingCb: true,
      isUserInputRequired: false,
      idx: 0,
    },
    selfSubmitFunction: jest.fn(),
    stepMetadata: {
      isStepSelfSubmittable: true,
      numOfCallbacks: 2,
      numOfSelfSubmittableCbs: 2,
      numOfUserInputCbs: 0,
    },
  },
};

const Template = (args) => ({
  Component: PollingWait,
  props: args,
});

export const Interaction = Template.bind({});

Interaction.args = { ...Base.args };

Interaction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(Base.args.selfSubmitFunction).not.toBeCalled();

  const callback = step.getCallbackOfType(CallbackType.PollingWaitCallback);
  const message = callback.getMessage();
  const time = callback.getWaitTime();

  await expect(canvas.getByText(message)).toBeInTheDocument();

  await new Promise((resolve) => setTimeout(resolve, time + 1000));
  await expect(Base.args.selfSubmitFunction).toBeCalled();
};
