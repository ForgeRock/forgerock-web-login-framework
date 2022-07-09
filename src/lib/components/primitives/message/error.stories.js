import { screen, userEvent } from '@storybook/testing-library';

import Error from './error.svelte';

export default {
  component: Error,
  parameters: {
    layout: 'centered',
  },
  title: 'Primitives/Error'
};

export const Base = {
  args: {
    errorMessage: 'Please review your input.',
    key: 'errorMessage',
  },
}
