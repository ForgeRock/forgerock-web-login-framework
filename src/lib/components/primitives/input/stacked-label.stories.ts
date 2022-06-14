import Input from './stacked-label.svelte';

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

export const Simple = {
  args: {
    key: 'simpleInput',
    label: 'Username',
    onChange: (e) => console.log(e.target.value),
    placeholder: 'E.g. my-username',
    value: '',
  },
};
