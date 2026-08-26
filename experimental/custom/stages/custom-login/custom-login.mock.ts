/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';

import type { Step } from '@forgerock/journey-client/types';

/**
 * Mock AM response — a DefaultLogin step with username + password callbacks.
 *
 * Use this object to drive Storybook stories or Vitest tests without a live
 * AM connection. Pass it to `createJourneyStep(customLoginStep)` to get a
 * Journey Client step, then pass the step as the `step` prop to your stage component.
 *
 * Shape mirrors a real AM /json/authenticate response:
 *   authId      — fake JWT (valid shape; AM would reject it in a real request,
 *                 but safe for local rendering / testing).
 *   callbacks   — ordered array of AM callback objects. The stage component
 *                 iterates `step.callbacks` and passes each to <CallbackMapper>.
 *   stage       — the stage name reported by the AM node; drives the
 *                 map-stage.utilities.ts lookup that selects this component.
 *   header      — maps to the `loginHeader` locale key shown as the page title.
 *   description — HTML string rendered as journey links (register, forgot pw).
 *                 In modal mode, captureLinks() intercepts these anchor clicks.
 */
export const customLoginStep: Step = {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkxvZ2luIiwib3RrIjoiY3VzdG9tLWxvZ2luLWRlbW8iLCJhdXRoSW5kZXhUeXBlIjoic2VydmljZSIsInJlYWxtIjoiL2FscGhhIn0.demo',
  callbacks: [
    {
      // First callback: username field.
      type: callbackType.NameCallback,
      output: [{ name: 'prompt', value: 'Username' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
    {
      // Second callback: password field.
      // PasswordCallback works identically to NameCallback; the renderer
      // switches to type="password" automatically.
      type: callbackType.PasswordCallback,
      output: [{ name: 'prompt', value: 'Password' }],
      input: [{ name: 'IDToken2', value: '' }],
      _id: 1,
    },
  ],
  stage: 'DefaultLogin',
  header: 'Sign In',
  // HTML string with journey links. captureLinks() intercepts clicks in modal mode.
  description:
    'New here? <a href="#/service/Registration">Create an account</a><br><a href="#/service/ForgottenUsername">Forgot username?</a><a href="#/service/ResetPassword"> Forgot password?</a>',
};
