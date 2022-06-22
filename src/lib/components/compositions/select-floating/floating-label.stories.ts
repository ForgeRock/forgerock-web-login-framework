import Select from './floating-label.story.svelte';

export default {
  component: Select,
  title: 'Compositions/Select: Floating',
  argTypes: {},
};

export const Base = {
  args: {
    isRequired: false,
    key: 'uniqueId',
    label: 'Select your option',
    options: [
      { value: null, text: 'Choose Color' },
      { value: 0, text: 'Red' },
      { value: 1, text: 'Green' },
      { value: 2, text: 'Blue' },
    ],
  },
};

export const Error = {
  args: {
    errorMessage: 'Please select an option',
    isRequired: true,
    key: 'uniqueId',
    label: 'Select your option',
    options: [
      { value: null, text: 'Choose Color' },
      { value: 0, text: 'Red' },
      { value: 1, text: 'Green' },
      { value: 2, text: 'Blue' },
    ],
  },
};
