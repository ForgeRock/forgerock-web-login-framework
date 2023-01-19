import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { expect, jest } from '@storybook/jest';
import { userEvent, within } from '@storybook/testing-library';

import response from './confirmation.mock';
import Confirmation from './confirmation.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
    inputName: { control: false },
  },
  component: Confirmation,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/Confirmation',
};

export const Base = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.ConfirmationCallback)[0],
    callbackMetadata: {
      derived: {
        isFirstInvalidInput: false,
        isReadyForSubmission: false,
        isSelfSubmitting: false,
        isUserInputRequired: true,
      },
      idx: 0,
    },
    stepMetadata: {
      derived: {
        isStepSelfSubmittable: false,
        numOfCallbacks: 2,
        numOfSelfSubmittableCbs: 0,
        numOfUserInputCbs: 2,
      },
    },
  },
};

export const SingleOptSelfSubmit = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.ConfirmationCallback)[1],
    callbackMetadata: {
      derived: {
        isFirstInvalidInput: false,
        isReadyForSubmission: false,
        isSelfSubmitting: true,
        isUserInputRequired: true,
      },
      idx: 0,
    },
    stepMetadata: {
      derived: {
        isStepSelfSubmittable: true,
        numOfCallbacks: 2,
        numOfSelfSubmittableCbs: 2,
        numOfUserInputCbs: 0,
      },
    },
  },
};

export const TwoOptSelfSubmit = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.ConfirmationCallback)[0],
    callbackMetadata: {
      derived: {
        isFirstInvalidInput: false,
        isReadyForSubmission: false,
        isSelfSubmitting: true,
        isUserInputRequired: false,
      },
      idx: 0,
    },
    selfSubmitFunction: jest.fn(),
    stepMetadata: {
      derived: {
        isStepSelfSubmittable: true,
        numOfCallbacks: 2,
        numOfSelfSubmittableCbs: 2,
        numOfUserInputCbs: 0,
      },
    },
  },
};

const Template = (args) => ({
  Component: Confirmation,
  props: args,
});

export const BaseInteraction = Template.bind({});

BaseInteraction.args = { ...Base.args };

BaseInteraction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const cb = step.getCallbacksOfType(CallbackType.ConfirmationCallback)[0];
  const select = canvas.getByLabelText('Please confirm');

  await userEvent.selectOptions(select, '0');
  await expect(cb.getInputValue()).toBe(0);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.selectOptions(select, '1');
  await expect(cb.getInputValue()).toBe(1);
};

export const ButtonInteraction = Template.bind({});

ButtonInteraction.args = { ...TwoOptSelfSubmit.args };

ButtonInteraction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const cb = step.getCallbacksOfType(CallbackType.ConfirmationCallback)[0];
  const posButton = canvas.getByRole('button', { name: 'Yes' });

  await userEvent.click(posButton);
  await expect(cb.getInputValue()).toBe(0);
  await expect(TwoOptSelfSubmit.args.selfSubmitFunction).toBeCalled();

  await new Promise((resolve) => setTimeout(resolve, 1000));
  const negButton = canvas.getByRole('button', { name: 'No' });

  await userEvent.click(negButton);
  await expect(cb.getInputValue()).toBe(1);
};
