import Select from './select.svelte';

export default {
  component: Select,
  title: 'Primitives/Select',
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
};

export const LabelFirst = {
  args: {
    isRequired: false,
    key: 'uniqueId',
    label: 'Favorite Color',
    onChange: () => console.log('Checkbox value updated'),
    options: [
      { value: null, text: 'Choose Color' },
      { value: 0, text: 'Red' },
      { value: 1, text: 'Green' },
      { value: 2, text: 'Blue' },
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
      { value: null, text: 'Choose Color' },
      { value: 0, text: 'Red' },
      { value: 1, text: 'Green' },
      { value: 2, text: 'Blue' },
    ],
    defaultOption: null,
  }
};
