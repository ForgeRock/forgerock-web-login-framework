/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { CallbackType } from '@forgerock/javascript-sdk';

export const deviceProfileMockNoMessage = {
  callbacks: [
    {
      type: CallbackType.DeviceProfileCallback,
      output: [
        {
          name: 'metadata',
          value: true,
        },
        {
          name: 'location',
          value: true,
        },
        {
          name: 'message',
          value: '',
        },
      ],
      input: [
        {
          name: 'IDToken1',
          value: '',
        },
      ],
    },
  ],
};

export const deviceProfileMockMessage = {
  callbacks: [
    {
      type: CallbackType.DeviceProfileCallback,
      output: [
        {
          name: 'metadata',
          value: true,
        },
        {
          name: 'location',
          value: true,
        },
        {
          name: 'message',
          value: 'This is a message',
        },
      ],
      input: [
        {
          name: 'IDToken1',
          value:
            '{"identifier":"2258096159-3136287393-51942348","metadata":{"hardware":{"cpuClass":null,"deviceMemory":8,"hardwareConcurrency":16,"maxTouchPoints":0,"oscpu":null,"display":{"width":1792,"height":1120,"pixelDepth":30,"angle":0}},"browser":{"userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36","appName":"Netscape","appCodeName":"Mozilla","appVersion":"5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36","appMinorVersion":null,"buildID":null,"product":"Gecko","productSub":"20030107","vendor":"Google Inc.","vendorSub":"","browserLanguage":null,"plugins":"internal-pdf-viewer;mhjfbmdgcfjbbpaeojofohoefgiehjai;internal-nacl-plugin;"},"platform":{"language":"en-US","platform":"MacIntel","userLanguage":null,"systemLanguage":null,"deviceName":"Mac (Browser)","fonts":"cursive;monospace;sans-serif;fantasy;Arial;Arial Black;Arial Narrow;Arial Rounded MT Bold;Comic Sans MS;Courier;Courier New;Georgia;Impact;Papyrus;Tahoma;Trebuchet MS;Verdana;","timezone":360}},"location":{}}',
        },
      ],
    },
  ],
};
