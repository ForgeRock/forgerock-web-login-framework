/**
 * Storybook stories for the __COMPONENT_NAME__ callback.
 *
 * Update the `getCallback` helper if your mock contains more than one callback,
 * or add additional stories for variants (loading, error, prefilled, etc.).
 */

import step from './__COMPONENT_SLUG__.mock';
import Story from './__COMPONENT_SLUG__.story.svelte';

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Story,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Custom/Callback/__COMPONENT_NAME__',
};

const getCallback = () => step.callbacks[0];

export const Base = {
  args: {
    callback: getCallback(),
  },
};
