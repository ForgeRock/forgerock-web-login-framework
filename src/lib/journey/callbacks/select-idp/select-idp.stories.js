import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import {
  socialStep,
  socialStepLocalAuthNoForm,
  socialStepLocalAuthWithForm,
} from './select-idp.mock';
import Input from './select-idp.story.svelte';

const social = new FRStep(socialStep);
const socialLocalAuthNoForm = new FRStep(socialStepLocalAuthNoForm);
const socialLocalAuthWithFormStep = new FRStep(socialStepLocalAuthWithForm);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/SelectIdp',
};

export const Social = {
  args: {
    socialCallback: social.getCallbackOfType(CallbackType.SelectIdPCallback),
    localAuth: false,
  },
};

export const SocialLocalAuthNoForm = {
  args: {
    socialCallback: socialLocalAuthNoForm.getCallbackOfType(CallbackType.SelectIdPCallback),
    localAuth: true,
  },
};

export const SocialLocalAuthWithForm = {
  args: {
    socialCallback: socialLocalAuthWithFormStep.getCallbackOfType(CallbackType.SelectIdPCallback),
    localAuth: true,
    passwordCallback: socialLocalAuthWithFormStep.getCallbackOfType(CallbackType.PasswordCallback),
    usernameCallback: socialLocalAuthWithFormStep.getCallbackOfType(CallbackType.NameCallback),
  },
};
