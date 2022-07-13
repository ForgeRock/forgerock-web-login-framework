import Checkbox from './animated.story.svelte';

export default {
  argTypes: {
    label: {
      control: { type: 'text' },
    },
    key: {
      control: { type: 'text' },
    },
    value: {
      control: { type: 'boolean' },
    },
  },
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  title: 'Compositions/Checkbox: Animated',
};

export const Base = {
  args: {
    label: 'Check me!',
    key: 'uniqueId',
    onChange: () => console.log('Checkbox value updated'),
    value: false,
  }
};

export const LongLabel = {
  args: {
    label: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    key: 'uniqueId',
    onChange: () => console.log('Checkbox value updated'),
    value: false,
  }
};
