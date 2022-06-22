import Input from './input.svelte';

export default {
  component: Input,
  title: 'Primitives/Input',
  argTypes: {
    isRequired: {
      control: { type: 'boolean' },
    },
    label: {
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
    label: 'Username',
    placeholder: 'E.g.: my-username',
    onChange: () => console.log('Checkbox value updated'),
    value: '',
  }
};

export const LabelLast = {
  args: {
    isRequired: false,
    key: 'uniqueId',
    label: 'Username',
    labelOrder: 'last',
    placeholder: 'E.g.: my-username',
    onChange: () => console.log('Checkbox value updated'),
    value: '',
  }
};
