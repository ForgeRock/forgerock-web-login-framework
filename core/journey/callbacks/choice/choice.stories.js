/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { expect } from 'storybook/test';
import { userEvent, within } from 'storybook/test';

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
    callbackMetadata: {
      platform: { id: 'af15a3ef-3db1-45ce-b510-ec4ea514ab30', displayType: 'radio' },
    },
  },
};

export const Interaction = {
  args: { ...Base.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cb = step.getCallbacksOfType(CallbackType.ChoiceCallback)[0];

    const select = canvas.getByLabelText('Choose one');
    await userEvent.tab();

    expect(select).toHaveFocus();
    expect(select.value).toEqual('2');

    await userEvent.selectOptions(select, '1');
    expect(select.value).toEqual('1');

    await expect(cb.getInputValue()).toBe(1);
    await userEvent.selectOptions(select, '0');

    expect(select.value).toEqual('0');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  },
};

export const RadioInteraction = {
  args: { ...Radio.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cb = step.getCallbacksOfType(CallbackType.ChoiceCallback)[0];

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await userEvent.click(canvas.getByLabelText('Choice A'));
    await expect(cb.getInputValue()).toBe(0);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await userEvent.click(canvas.getByLabelText('Choice B'));
    await expect(cb.getInputValue()).toBe(1);
  },
};
