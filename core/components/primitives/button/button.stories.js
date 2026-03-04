/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { userEvent, within } from 'storybook/test';

import Button from './button.story.svelte';

export default {
  argTypes: {
    busy: {
      options: [true, false],
      control: { type: 'boolean' },
    },
    style: {
      options: ['outline', 'primary', 'secondary'],
      control: { type: 'radio' },
    },
    type: {
      options: ['button', 'submit'],
      control: { type: 'radio' },
    },
    width: {
      options: ['auto', 'full'],
      control: { type: 'radio' },
    },
  },
  component: Button,
  parameters: {
    layout: 'centered',
  },
  title: 'Primitives/Button',
};

export const Primary = {
  args: {
    busy: false,
    style: 'primary',
    text: 'Click Me',
    type: 'button',
    width: 'auto',
  },
};

export const Secondary = {
  args: {
    busy: false,
    style: 'secondary',
    text: 'Click Me',
    type: 'button',
    width: 'auto',
  },
};

export const Outline = {
  args: {
    busy: false,
    style: 'outline',
    text: 'Click Me',
    type: 'button',
    width: 'auto',
  },
};

export const Custom = {
  args: {
    busy: false,
    customCss: {
      primary: [
        { key: 'color', value: '#000000' },
        { key: 'background-color', value: '#bada55' },
        { key: 'border-color', value: '#bada55' },
      ],
    },
    style: 'outline',
    text: 'Click Me',
    type: 'button',
    width: 'auto',
  },
};

export const FullWidthPrimary = {
  args: {
    busy: false,
    style: 'primary',
    text: 'Click Me',
    type: 'button',
    width: 'full',
  },
};

export const Interaction = {
  args: Primary.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await userEvent.tab();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const buttonEl = canvas.getByText('Click Me', {
      selector: 'button',
    });
    await userEvent.click(buttonEl);
  },
};
