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
    onChange: () => console.log('Checkbox value updated'),
    options: [
      { value: null, text: 'Choose Color' },
      { text: 'Red', value: 0 },
      { text: 'Green', value: 1 },
      { text: 'Blue', value: 2 },
    ],
    defaultOption: 0,
  }
};

export const LabelLast = {
  args: {
    isRequired: false,
    key: 'uniqueId',
    label: 'Favorite Color',
    labelOrder: 'last',
    onChange: () => console.log('Checkbox value updated'),
    options: [
      { text: 'Choose Color', value: null },
      { text: 'Red', value: 0 },
      { text: 'Green', value: 1 },
      { text: 'Blue', value: 2 },
    ],
    defaultOption: null,
  }
};
