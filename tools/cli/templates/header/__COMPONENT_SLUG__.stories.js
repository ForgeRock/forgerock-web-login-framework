/**
 * Storybook stories for the __COMPONENT_NAME__ header.
 *
 * Header components take no props, so stories differ only in the stand-in
 * journey placeholder rendered beneath the header.
 */

import Story from './__COMPONENT_SLUG__.story.svelte';

export default {
  component: Story,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Custom/Header/__COMPONENT_NAME__',
};

export const Base = {
  args: {
    journeyPlaceholder: 'Journey renders here (below the custom header)',
  },
};
