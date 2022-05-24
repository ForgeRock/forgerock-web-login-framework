import Select from './select.svelte';

export default {
  component: Select,
  title: 'Primitives/Select',
  argTypes: {},
};

export const Simple = {
  args: {
    key: 'uniqueId',
    label: 'Select your option',
    options: ['Red', 'Green', 'Blue'],
  },
}
