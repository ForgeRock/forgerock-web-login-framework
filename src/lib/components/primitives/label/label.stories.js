import Label from './label.story.svelte';

export default {
  argTypes: {},
  component: Label,
  parameters: {
    layout: 'centered',
  },
  title: 'Primitives/Label',
};

export const Base = {
  args: {
    key: 'uniqueId',
    label: 'Username',
  }
};
