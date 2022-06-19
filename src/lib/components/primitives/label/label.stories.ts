import Label from './label.story.svelte';

export default {
  component: Label,
  title: 'Primitives/Label',
  argTypes: {},
};

export const Basic = {
  args: {
    key: 'uniqueId',
    label: 'Username',
  }
};
