/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import Input from './input.story.svelte';
import { expect, fn } from 'storybook/test';
import { within, userEvent } from 'storybook/test';

export default {
  argTypes: {
    isRequired: {
      control: { type: 'boolean' },
    },
    label: {
      control: { type: 'text' },
    },
    value: {
      control: { type: 'text' },
    },
  },
  component: Input,

  parameters: {
    layout: 'centered',
  },
  title: 'Primitives/Input',
};

export const LabelFirst = {
  args: {
    key: 'uniqueId',
    label: 'Username',
    placeholder: 'E.g.: my-username',
    onChange: fn(() => console.log('Checkbox value updated')),
  },
};

export const LabelLast = {
  args: {
    key: 'uniqueId',
    label: 'Username',
    labelOrder: 'last',
    placeholder: 'E.g.: my-username',
    onChange: () => console.log('Checkbox value updated'),
  },
};

export const Interaction = {
  args: { ...LabelFirst.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();

    await userEvent.type(canvas.getByLabelText('Username'), 'input here');

    await new Promise((res) => setTimeout(res, 1000));

    await userEvent.tab();

    await expect(LabelFirst.args.onChange).toHaveBeenCalled();
  },
};
