import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { expect } from '@storybook/jest';
import { userEvent, within } from '@storybook/testing-library';

import response from './choice.mock';
import Input from './choice.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
    displayType: {
      control: { type: 'text' },
    },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/Choice',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.ChoiceCallback),
  },
};

export const Radio = {
  args: {
    ...Base.args,
    displayType: 'radio',
  },
};

const Template = (args) => ({
  Component: Input,
  props: args,
});

export const Interaction = Template.bind({});

Interaction.args = { ...Base.args };

Interaction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const cb = step.getCallbacksOfType(CallbackType.ChoiceCallback)[0];

  const select = canvas.getByLabelText('Choose one');
  await userEvent.tab();

  expect(select).toHaveFocus();
  expect(select.value).toEqual("2")

  userEvent.selectOptions(select, "1")
  expect(select.value).toEqual("1")

  await expect(cb.getInputValue()).toBe(1);
  userEvent.selectOptions(select, "0")

  expect(select.value).toEqual("0")
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
export const RadioInteraction = Template.bind({});

RadioInteraction.args = { ...Radio.args };

RadioInteraction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const cb = step.getCallbacksOfType(CallbackType.ChoiceCallback)[0];

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.click(canvas.getByLabelText('Choice A'));
  await expect(cb.getInputValue()).toBe(0);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.click(canvas.getByLabelText('Choice B'));
  await expect(cb.getInputValue()).toBe(1);
};
