import { screen, userEvent } from '@storybook/testing-library';

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
    customCss: [
      { key: 'color', value: '#000000' },
      { key: 'background-color', value: '#bada55' },
      { key: 'border-color', value: '#bada55'},
    ],
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

const Template = (args) => ({
  Component: Button,
  props: args,
});

export const Interaction = Template.bind({});

Interaction.args = Primary.args;

Interaction.play = async () => {

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const buttonEl = screen.getByText('Click Me', {
    selector: 'button',
  });
  await userEvent.click(buttonEl);
};
