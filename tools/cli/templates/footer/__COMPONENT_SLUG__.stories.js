/**
 * Storybook stories for the __COMPONENT_NAME__ footer.
 *
 * Footer components take no props, so stories differ only in the stand-in
 * journey placeholder rendered above the footer.
 */

import Story from './__COMPONENT_SLUG__.story.svelte';

export default {
  component: Story,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Custom/Footer/__COMPONENT_NAME__',
};

export const Base = {
  args: {
    journeyPlaceholder: 'Journey renders here (above the custom footer)',
  },
};
