/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import Alert from './alert.story.svelte';

export default {
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  title: 'Primitives/Alert',
};

export const Base = {
  args: {
    message: 'Your profile has been updated.',
  },
};
export const Info = {
  args: {
    type: 'info',
    message: 'Your profile has been updated.',
  },
};
export const Error = {
  args: {
    type: 'error',
    message: 'Provided credentials are incorrect.',
  },
};
export const Success = {
  args: {
    type: 'success',
    message: 'Your password was successfully changed.',
  },
};
export const Warning = {
  args: {
    type: 'warning',
    message: 'Please review provided information.',
  },
};
