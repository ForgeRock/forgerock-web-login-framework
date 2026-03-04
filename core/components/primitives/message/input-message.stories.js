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

export const Interaction = {
  args: { ...Base.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const paragraph = canvas.getByText('Please review your input.');
    expect(paragraph).toHaveTextContent('Please review your input.');
  },
};
