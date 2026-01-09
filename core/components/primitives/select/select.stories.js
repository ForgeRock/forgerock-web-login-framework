/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, fn } from 'storybook/test';
import { userEvent, within } from 'storybook/test';
import Select from './select.story.svelte';

export default {
  argTypes: {
    isRequired: {
      control: { type: 'boolean' },
    },
    label: {
      control: { type: 'text' },
    },
    key: {
      control: { type: 'text' },
    },
    value: {
      control: { type: 'text' },
    },
  },
  component: Select,
  parameters: {
    layout: 'centered',
  },
  title: 'Primitives/Select',
};

export const LabelFirst = {
  args: {
    isRequired: false,
    key: 'uniqueId',
    label: 'Favorite Color',
    onChange: fn(),
    options: [
      { value: null, text: 'Choose Color' },
      { text: 'Red', value: 0 },
      { text: 'Green', value: 1 },
      { text: 'Blue', value: 2 },
    ],
    defaultOption: 0,
  },
};

export const LabelLast = {
  args: {
    isRequired: false,
    key: 'uniqueId',
    label: 'Favorite Color',
    labelOrder: 'last',
    onChange: fn(),
    options: [
      { text: 'Choose Color', value: null },
      { text: 'Red', value: 0 },
      { text: 'Green', value: 1 },
      { text: 'Blue', value: 2 },
    ],
    defaultOption: null,
  },
};

export const Interaction = {
  args: { ...LabelLast.args, label: 'Choose Color' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const label = canvas.getByLabelText('Choose Color');

    await userEvent.tab();

    expect(label).toHaveFocus();

    expect(LabelLast.args.onChange).not.toHaveBeenCalled();

    await userEvent.selectOptions(label, ['0']);
    expect(canvas.getByText('Red')).toHaveTextContent('Red');
    expect(LabelLast.args.onChange).toHaveBeenCalled();
    await userEvent.selectOptions(label, ['1']);
    expect(canvas.getByText('Green')).toHaveTextContent('Green');
    expect(LabelLast.args.onChange).toHaveBeenCalled();
    await userEvent.selectOptions(label, ['2']);
    expect(canvas.getByText('Blue')).toHaveTextContent('Blue');
  },
};
