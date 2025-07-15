/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { userEvent } from '@storybook/testing-library';

import Buttons from './grid.story.svelte';

export default {
  component: Buttons,
  title: 'Primitives/Grid',
  argTypes: {},
};

export const ThreeTwo = {
  args: {},
};

const Template = (args) => ({
  Component: Buttons,
  props: args,
});

export const Interaction = Template.bind({});

Interaction.args = ThreeTwo.args;

Interaction.play = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.tab();
};
