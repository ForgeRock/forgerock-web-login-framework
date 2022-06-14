import Button from './button.story.svelte';

export default {
  component: Button,
  title: 'Primitives/Button',
  argTypes: {
    busy: {
      options: [true, false],
      control: { type: 'radio' },
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
      options: ['auto', 'full', 'half', 'third'],
      control: { type: 'radio' },
    },
  },
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
