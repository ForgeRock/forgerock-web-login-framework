import { expect, jest } from '@storybook/jest';
import { userEvent, within } from '@storybook/testing-library';
import Label from './label.story.svelte';

export default {
  argTypes: {},
  component: Label,
  parameters: {
    layout: 'centered',
  },
  title: 'Primitives/Label',
};

export const Base = {
  args: {
    key: 'uniqueId',
    inputLabel: 'Username',
  },
};


const Template = (args) => ({
  Component: Label,
  props: args
});
export const Interaction = Template.bind({});

Interaction.args = { ...Base.args, inputLabel: 'Username' };

Interaction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const text = canvas.getByText('Username')
  expect(text).toBeInTheDocument();
}

