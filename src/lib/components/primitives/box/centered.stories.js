import { screen, userEvent } from '@storybook/testing-library';

import Centered from './centered.story.svelte';

export default {
  component: Centered,
  title: 'Primitives/Box'
};

export const CenteredBox = {
  args: {}
}
