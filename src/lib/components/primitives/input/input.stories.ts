import Input from './input.svelte';

export default {
  component: Input,
  title: 'Primitives/Input',
  argTypes: {
    key: { control: 'text' },
    label: { control: 'text' },
    type: { control: 'select', options: ['date', 'email', 'number', 'password', 'phone', 'text'] },
    value: { control: 'text' },
  },
};

export const Simple = {
  args: {
    key: 'simpleInput',
    label: 'Username',
    onChange: (e) => console.log(e.target.value),
    value: '',
  },
};
