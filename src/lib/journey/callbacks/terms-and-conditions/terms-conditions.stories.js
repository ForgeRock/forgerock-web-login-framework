/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { expect } from '@storybook/jest';
import { userEvent, within } from '@storybook/testing-library';

import response from './terms-conditions.mock';
import Input from './terms-conditions.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/TermsAndConditions',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.TermsAndConditionsCallback),
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
  const cb = step.getCallbackOfType(CallbackType.TermsAndConditionsCallback);
  const element = canvas.getByRole('checkbox');
  await userEvent.click(element);
  await userEvent.tab();
  expect(cb.getInputValue()).toBe(true);
};
