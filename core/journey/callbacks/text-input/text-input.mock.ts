/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { CallbackType } from '@forgerock/javascript-sdk';

export default {
  authId: 'test-auth-id',
  callbacks: [
    {
      type: CallbackType.TextInputCallback,
      output: [{ name: 'prompt', value: 'Security answer' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
    {
      type: CallbackType.TextInputCallback,
      output: [{ name: 'prompt', value: 'Recovery phrase' }],
      input: [{ name: 'IDToken2', value: 'my current phrase' }],
      _id: 1,
    },
  ],
  stage: 'DefaultLogin',
};

export const docsExample = {
  type: 'TextInputCallback',
  output: [{ name: 'prompt', value: 'Security answer' }],
  input: [{ name: 'IDToken1', value: '' }],
};
