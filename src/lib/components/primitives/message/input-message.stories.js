import ErrorComponent from './input-message.svelte';

export default {
  component: ErrorComponent,
  parameters: {
    layout: 'centered',
  },
  title: 'Primitives/InputMessage',
};

export const Base = {
  args: {
    message: 'Please review your input.',
    key: 'infoMessage',
    type: 'info'
  },
};

export const Error = {
  args: {
    message: 'Please review your input.',
    key: 'infoMessage',
    type: 'info'
  },
};
