/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';

export const docsExample = {
  type: callbackType.MetadataCallback,
  output: [
    {
      name: 'data',
      value: {
        myParameter: 'MyValue',
      },
    },
  ],
};
