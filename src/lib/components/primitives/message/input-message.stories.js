import { expect } from '@storybook/jest';
import { within } from '@storybook/testing-library';
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
    dirtyMessage: 'Please review your input.',
    key: 'infoMessage',
    type: 'info',
  },
};

export const Error = {
  args: {
    dirtyMessage: 'There is an error in your input.',
    key: 'errorMessage',
    type: 'error',
  },
};

const Template = (args) => ({
  Component: ErrorComponent,
  props: args
});
export const Interaction = Template.bind({});
Interaction.args = { ...Base.args };

Interaction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const paragraph = canvas.getByText('Please review your input.')
  expect(paragraph).toHaveTextContent('Please review your input.');
}
