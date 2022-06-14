import Spinner from './spinner.svelte';

export default {
  component: Spinner,
  title: 'Primitives/Spinner',
  argTypes: {
    colorClass: { control: 'text' },
    layoutClasses: { control: 'text' },
  },
};

export const Simple = {
  args: {
    colorClass: 'tw_text-primary-light',
    layoutClasses: "tw_h-8 tw_w-8",
  },
};
