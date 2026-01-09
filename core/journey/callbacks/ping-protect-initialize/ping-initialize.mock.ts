/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

export const PingProtectInitializeData = {
  authid: 'foo',
  callbacks: [
    {
      type: 'PingOneProtectInitializeCallback',
      output: [
        {
          name: 'envid',
          value: '02fb1243-189a-4bc7-9d6c-a919edf6447',
        },
        {
          name: 'consolelogenabled',
          value: true,
        },
        {
          name: 'deviceattributestoignore',
          value: ['useragent'],
        },
        {
          name: 'customhost',
          value: 'http://localhost',
        },
        {
          name: 'lazymetadata',
          value: false,
        },
        {
          name: 'behavioraldatacollection',
          value: true,
        },
        {
          name: 'devicekeyrsyncintervals',
          value: 14,
        },
        {
          name: 'enabletrust',
          value: false,
        },
        {
          name: 'disabletags',
          value: false,
        },
        {
          name: 'disablehub',
          value: false,
        },
      ],
      input: [
        {
          name: 'idtoken1clienterror',
          value: '',
        },
      ],
    },
  ],
} as const;
