import Select from './stacked-label.svelte';

export default {
  component: Select,
  title: 'Primitives/Select: Stacked Label',
  argTypes: {},
};

export const Simple = {
  args: {
    key: 'uniqueId',
    label: 'Select your option',
    options: ['Red', 'Green', 'Blue'],
  },
}
