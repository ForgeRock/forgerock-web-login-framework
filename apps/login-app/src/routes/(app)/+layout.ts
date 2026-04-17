/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import configure from '$core/sdk.config';
import { setJourneyClientConfig } from '$core/journey-client.config';
import { initialize as initializeJourneys } from '$journey/config.store';
import { initialize as initializeLinks } from '$core/links.store';

import '../../app.css';
import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ data }) => {
  if (data.wellknown) {
    setJourneyClientConfig({
      serverConfig: {
        wellknown: data.wellknown,
      },
    });
  } else {
    console.warn('Wellknown URL is not configured.');
  }

  configure({
    clientId: data.clientId,
    redirectUri: `${browser ? window.location.origin : 'https://placeholder.com'}/callback`,
    ...(data.scope && { scope: data.scope }),
    serverConfig: {
      baseUrl: data.amUrl,
    },
    realmPath: data.realmPath,
  });
  initializeJourneys();

  initializeLinks({
    termsAndConditions: 'https://www.forgerock.com/terms',
  });

  return data;
};
