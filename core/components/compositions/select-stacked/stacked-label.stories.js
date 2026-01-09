/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { userEvent, within } from 'storybook/test';
import { expect, fn } from 'storybook/test';

import Select from './stacked-label.story.svelte';

export default {
  argTypes: {},
  component: Select,
  parameters: {
    layout: 'centered',
  },
  title: 'Compositions/Select: Stacked',
};

export const Base = {
  args: {
    checkValidity: fn((e) => {
      const el = e.target;
      console.log(el.value);
      return !!el.value;
    }),
    key: 'uniqueId',
    label: 'Select your option',
    onChange: (e) => console.log(e.target.value),
    options: [
      { value: null, text: 'Choose Color' },
      { value: 0, text: 'Red' },
      { value: 1, text: 'Green' },
      { value: 2, text: 'Blue' },
    ],
  },
};

export const LongLabel = {
  args: {
    checkValidity: (e) => {
      const el = e.target;
      console.log(el.value);
      return !!el.value;
    },
    key: 'uniqueId',
    label: 'This is a very long label for testing purposes',
    onChange: (e) => console.log(e.target.value),
    options: [
      { value: null, text: 'This is a very long label for testing purposes' },
      { value: 0, text: 'Red' },
      { value: 1, text: 'Green' },
      { value: 2, text: 'Blue' },
    ],
  },
};

export const Error = {
  args: {
    ...Base.args,
    onChange: fn(),
    errorMessage: 'Please select an option',
    isRequired: true,
  },
};

export const Interaction = {
  args: { ...Error.args, errorMessage: '', withForm: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await userEvent.tab();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await userEvent.tab();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const submitButton = canvas.getByText('Trigger Error');
    await userEvent.click(submitButton);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const inputEl = canvas.getByLabelText('Select your option', {
      selector: 'select',
    });
    await userEvent.selectOptions(inputEl, '1');
    expect(Error.args.onChange).toHaveBeenCalled();
    expect(Error.args.checkValidity).toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await userEvent.tab();
  },
};
