import Input from './stacked-label.story.svelte';

export default {
  component: Input,
  title: 'Primitives/Input: Stacked Label',
  argTypes: {
    key: { control: 'text' },
    label: { control: 'text' },
    type: { control: 'select', options: ['date', 'email', 'number', 'password', 'phone', 'text'] },
    value: { control: 'text' },
  },
};

export const Base = {
  args: {
    isRequired: false,
    key: 'simpleInput',
    label: 'Username',
    onChange: (e) => console.log(e.target.value),
    placeholder: 'E.g. my-username',
    value: '',
  },
};

export const Error = {
  args: {
    isRequired: true,
    key: 'simpleInput',
    label: 'Username',
    onChange: (e) => console.log(e.target.value),
    placeholder: 'E.g. my-username',
    value: '',
  },
};
