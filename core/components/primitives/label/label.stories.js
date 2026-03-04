/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect } from 'storybook/test';
import { within } from 'storybook/test';
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

export const Interaction = {
  args: { ...Base.args, inputLabel: 'Username' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = canvas.getByText('Username');
    expect(text).toBeInTheDocument();
  },
};
