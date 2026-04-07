/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { CallbackType } from '@forgerock/javascript-sdk';

/**
 * Mock AM response — a minimal step payload containing a single NameCallback.
 *
 * Use this object to drive Storybook stories or Vitest tests without a live
 * AM connection. Pass it to `new FRStep(response)` to get a fully-typed SDK
 * step, then extract the callback with `step.getCallbackOfType(...)`.
 *
 * Shape mirrors a real AM /json/authenticate response:
 *   authId    — the JWT that AM uses to track session state across steps.
 *               The value here is a fake token; AM will reject it, but it is
 *               safe for local rendering / testing.
 *   callbacks — array of AM callback objects; each has `type`, `output`, and
 *               `input` arrays. `output` carries server-to-client data (e.g.
 *               the prompt label); `input` carries the client response slot.
 *   stage     — the stage name reported by the AM node (drives map-stage lookup).
 *   header    — displayed as the page/modal title (localization key: loginHeader).
 */
export default {
  authId:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSW5kZXhWYWx1ZSI6IkxvZ2luIiwib3RrIjoiY3VzdG9tLW5hbWUtZGVtbyIsImF1dGhJbmRleFR5cGUiOiJzZXJ2aWNlIiwicmVhbG0iOiIvYWxwaGEifQ.demo',
  callbacks: [
    {
      // CallbackType.NameCallback === 'NameCallback'
      type: CallbackType.NameCallback,
      // output carries data FROM the server (the visible label for this field).
      output: [{ name: 'prompt', value: 'User Name' }],
      // input is the slot the client fills in before submitting the step.
      // The name (IDToken1) is what the SDK reads back via callback.payload.input[0].name.
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
  ],
  stage: 'DefaultLogin',
  header: 'Sign In',
  description: '',
};
