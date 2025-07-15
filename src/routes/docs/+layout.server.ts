/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
  return {
    package: {
      name: 'Login Widget',
      version: 'Beta',
    },
    app: {
      name: 'Login App',
      version: 'Alpha',
    },
    framework: {
      name: 'Web Login Framework',
      version: 'Alpha',
    },
  };
};
