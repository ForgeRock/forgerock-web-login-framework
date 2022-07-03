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

export const Simple = {
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

export const VeryLongText = {
  args: {
    key: 'uniqueId',
    name: 'color-selection',
    onChange: () => console.log('Checkbox value updated'),
    options: [
      { text: 'This is a very long label that needs to be gracefully handled by the UI', value: 0 },
      { text: 'This is another long label that will need to not break the layout', value: 1 },
    ],
    value: false,
  },
};
