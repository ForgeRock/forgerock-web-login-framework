import Input from './floating-label.story.svelte';

export default {
  component: Input,
  title: 'Compositions/Input: Floating',
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
    value: '',
  },
};

export const Error = {
  args: {
    errorMessage: 'This field must have a value.',
    isRequired: true,
    key: 'simpleInput',
    label: 'Username',
    onChange: (e) => console.log(e.target.value),
    value: '',
  },
}
