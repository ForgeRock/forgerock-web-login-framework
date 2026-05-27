/**
 * Storybook stories for the __COMPONENT_NAME__ stage.
 *
 * Add additional stories for variants (loading, with form error, etc.) by
 * cloning the `Base` args and overriding the relevant fields.
 */

import { fn } from 'storybook/test';
import { writable } from 'svelte/store';

import step from './__COMPONENT_SLUG__.mock';
import Story from './__COMPONENT_SLUG__.story.svelte';

export default {
  argTypes: {
    form: { control: false },
    journey: { control: false },
    step: { control: false },
  },
  component: Story,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Custom/Stage/__COMPONENT_NAME__',
};

export const Base = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: fn(),
    },
    journey: {
      loading: false,
      pop: fn(),
      push: fn(),
      stack: writable([]),
    },
    step,
  },
};
