import ErrorComponent from './input-message.svelte';

export default {
  component: ErrorComponent,
  parameters: {
    layout: 'centered',
  },
  title: 'Primitives/Input Message',
};

export const Base = {
  args: {
    message: 'Please review your input.',
    key: 'infoMessage',
    type: 'info',
  },
};

export const Error = {
  args: {
    message: 'There is an error in your input.',
    key: 'errorMessage',
    type: 'error',
  },
};
