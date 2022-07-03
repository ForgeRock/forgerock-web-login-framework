import Radio from './radio.story.svelte';

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
  title: 'Primitives/Radio: Standard',
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
