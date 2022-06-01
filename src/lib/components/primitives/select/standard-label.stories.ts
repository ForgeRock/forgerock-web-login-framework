import Select from './standard-label.svelte';

export default {
  component: Select,
  title: 'Primitives/Select: Standard Label',
  argTypes: {},
};

export const Simple = {
  args: {
    key: 'uniqueId',
    label: 'Select your option',
    options: ['Red', 'Green', 'Blue'],
  },
}
