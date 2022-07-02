import Label from './label.story.svelte';

export default {
  argTypes: {},
  component: Label,
  parameters: {
    layout: 'centered',
  },
  title: 'Primitives/Label',
};

export const Basic = {
  args: {
    key: 'uniqueId',
    label: 'Username',
  }
};
