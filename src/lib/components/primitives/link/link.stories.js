import { expect } from '@storybook/jest';
import { userEvent, within } from '@storybook/testing-library';
import Link from './link.story.svelte';

export default {
  component: Link,
  parameters: {
    layout: 'centered',
  },
  title: 'Primitives/Link',
};

export const Base = {
  args: {
    href: '/',
  },
};

const Template = (args) => ({
  Component: Link,
  props: args,
});
export const Interaction = Template.bind({});
Interaction.args = { ...Base.args };

Interaction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const link = canvas.getByRole('link');
  await userEvent.tab();
  expect(link).toHaveFocus();
  expect(link).toHaveAttribute('href', '/');
};
