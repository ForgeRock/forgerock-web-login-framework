/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import configure from '$lib/sdk.config';
import { initialize as initializeJourneys } from '$journey/config.store';
import { initialize as initializeLinks } from '$lib/links.store';

import '../../app.css';
import { browser } from '$app/environment';

configure({
  clientId: 'WebOAuthClient',
  redirectUri: `${browser ? window.location.origin : 'https://placeholder.com'}/callback`,
  scope: 'openid profile me.read',
  serverConfig: {
    baseUrl: 'https://openam-sdks.forgeblocks.com/am/',
  },
  realmPath: 'alpha',
});
initializeJourneys();

initializeLinks({
  termsAndConditions: 'https://www.forgerock.com/terms',
});
