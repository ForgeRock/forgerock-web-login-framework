/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

export const pingProtectEvaluate = {
  authId: 'foo',
  callbacks: [
    {
      type: 'PingOneProtectEvaluationCallback',
      output: [
        {
          name: 'pauseBehavioralData',
          value: true,
        },
      ],
      input: [
        {
          name: 'IDToken1signals',
          value: '',
        },
        {
          name: 'IDToken1clientError',
          value: '',
        },
      ],
    },
  ],
} as const;
