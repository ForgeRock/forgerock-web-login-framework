import Radio from './animated.story.svelte';

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
  component: Radio,
  parameters: {
    layout: 'centered',
  },
  title: 'Compositions/Radio: Animated',
};

export const Base = {
  args: {
    key: 'uniqueId',
    name: 'color-selection',
    onChange: () => console.log('Checkbox value updated'),
    options: [
      { text: 'Red', value: 0 },
      { text: 'Green', value: 1 },
      { text: 'Blue', value: 2 },
    ],
    value: false,
  },
};

export const LongLabel = {
  args: {
    key: 'uniqueId',
    name: 'color-selection',
    onChange: () => console.log('Checkbox value updated'),
    options: [
      { text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit', value: 0 },
      {
        text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        value: 1,
      },
    ],
    value: false,
  },
};
