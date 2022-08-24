import Spinner from './spinner.story.svelte';

export default {
  argTypes: {
    colorClass: { control: 'text' },
    layoutClasses: { control: 'text' },
  },
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  title: 'Primitives/Spinner',
};

export const Simple = {
  args: {
    colorClass: 'tw_text-primary-light',
    layoutClasses: 'tw_h-8 tw_w-8',
  },
};
