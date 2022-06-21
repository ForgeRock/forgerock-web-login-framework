import { screen, userEvent } from '@storybook/testing-library';

import Buttons from './button-group.story.svelte';

export default {
  component: Buttons,
  title: 'Primitives/Button Group',
  argTypes: {},
};

export const TwoUp = {
  args: {},
};

const Template = (args) => ({
  Component: Buttons,
  props: args,
});

export const Interaction = Template.bind({});

Interaction.args = TwoUp.args;

Interaction.play = async () => {

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();
};
