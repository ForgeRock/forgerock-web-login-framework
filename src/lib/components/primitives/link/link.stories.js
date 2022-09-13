import Link from './link.story.svelte';

export default {
  component: Link,
  parameters: {
    layout: 'centered',
  },
  title: 'Primitives/Link',
};

export const Base = {
  args: {
    href: '/',
  },
};
