/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';

import step from '../password/validated-create-password.mock';
import Policies from './policies.story.svelte';

export default {
  argTypes: {
    callback: { control: false },
    label: { control: false },
  },
  component: Policies,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/Utilities: Policies',
};

export const PasswordPolicies = {
  args: {
    callback: step.getCallbacksOfType(callbackType.ValidatedCreatePasswordCallback)[1],
    label: 'Password',
    messageKey: 'passwordRequirements',
  },
};

export const PasswordPolicyFailures = {
  args: {
    callback: step.getCallbacksOfType(callbackType.ValidatedCreatePasswordCallback)[2],
    label: 'Password',
    messageKey: 'passwordRequirements',
  },
};
