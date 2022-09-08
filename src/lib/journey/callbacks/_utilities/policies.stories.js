import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import response from '../password/validated-create-password.mock';
import Policies from './policies.story.svelte';

const step = new FRStep(response);

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
    callback: step.getCallbacksOfType(CallbackType.ValidatedCreatePasswordCallback)[1],
    label: 'Password',
    messageKey: 'passwordRequirements'
  },
};

export const PasswordPolicyFailures = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.ValidatedCreatePasswordCallback)[2],
    label: 'Password',
    messageKey: 'passwordRequirements'
  },
};
