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

import response from './password.mock';
import Input from './password.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/Password',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.PasswordCallback),
    style: {
      showPassword: 'button',
    },
  },
};

export const PasswordWithCheckbox = {
  args: {
    callback: step.getCallbackOfType(CallbackType.PasswordCallback),
    style: {
      showPassword: 'checkbox',
    },
  },
};

export const PasswordWithNone = {
  args: {
    callback: step.getCallbackOfType(CallbackType.PasswordCallback),
    style: {
      showPassword: 'none',
    },
  },
};

export const Interaction = {
  args: { ...Base.args },
  play: async ({ canvasElement }) => {
    const cb = step.getCallbackOfType(CallbackType.PasswordCallback);
    const canvas = within(canvasElement);
    const passwordField = canvas.getByLabelText('Password');
    await userEvent.tab();
    expect(passwordField).toHaveFocus();

    await userEvent.keyboard('password');
    expect(passwordField.value).toBe('password');
    await userEvent.tab();
    const eye = canvas.getByRole('button');
    expect(eye).toHaveFocus();
    await userEvent.click(eye);
    expect(cb.getInputValue()).toBe('password');
  },
};

export const InteractionWithCheckbox = {
  args: { ...PasswordWithCheckbox.args },
  play: async ({ canvasElement }) => {
    const cb = step.getCallbackOfType(CallbackType.PasswordCallback);
    const canvas = within(canvasElement);
    const passwordField = canvas.getByLabelText('Password');
    await userEvent.tab();
    expect(passwordField).toHaveFocus();

    await userEvent.keyboard('password1');
    await userEvent.tab();
    const checkbox = canvas.getByRole('checkbox');
    expect(checkbox).toHaveFocus();
    await userEvent.click(checkbox);
    expect(cb.getInputValue()).toBe('password1');
  },
};

export const InteractionWithNone = {
  args: { ...PasswordWithNone.args },
  play: async ({ canvasElement }) => {
    const cb = step.getCallbackOfType(CallbackType.PasswordCallback);
    const canvas = within(canvasElement);
    const passwordField = canvas.getByLabelText('Password');
    await userEvent.tab();
    expect(passwordField).toHaveFocus();

    await userEvent.keyboard('password2');
    await userEvent.tab();
    expect(cb.getInputValue()).toBe('password2');
  },
};
