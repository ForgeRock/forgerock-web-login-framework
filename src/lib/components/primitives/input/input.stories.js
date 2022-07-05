import Input from './input.story.svelte';


export default {
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
  component: Input,

  parameters: {
    layout: 'centered',
  },
  title: 'Primitives/Input',
};

export const LabelFirst = {
  args: {
    key: 'uniqueId',
    label: 'Username',
    placeholder: 'E.g.: my-username',
    onChange: () => console.log('Checkbox value updated'),
  }
};

export const LabelLast = {
  args: {
    key: 'uniqueId',
    label: 'Username',
    labelOrder: 'last',
    placeholder: 'E.g.: my-username',
    onChange: () => console.log('Checkbox value updated'),
  }
};
