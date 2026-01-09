/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect } from 'storybook/test';
import { userEvent, within } from 'storybook/test';
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

export const Interaction = {
  args: { ...Base.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link');
    await userEvent.tab();
    expect(link).toHaveFocus();
    expect(link).toHaveAttribute('href', '/');
  },
};
