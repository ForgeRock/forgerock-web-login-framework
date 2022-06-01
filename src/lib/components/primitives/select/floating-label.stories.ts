import Select from './floating-label.svelte';

export default {
  component: Select,
  title: 'Primitives/Select: Floating Label',
  argTypes: {},
};

export const Simple = {
  args: {
    key: 'uniqueId',
    label: 'Select your option',
    options: ['Red', 'Green', 'Blue'],
  },
}
