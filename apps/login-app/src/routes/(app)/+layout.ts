/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import '../../app.css';
import { browser } from '$app/environment';
import { initialize as initializeLinks } from '$core/links.store';
import configure from '$core/sdk.config';
import { initialize as initializeStyles } from '$core/style.store';
import { initialize as initializeJourneys } from '$journey/config.store';

import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ data }) => {
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

  if (data.idmTheme) {
    initializeStyles({
      theme: data.idmTheme,
      ...(data.idmTheme.logo && {
        logo: {
          light: data.idmTheme.logo,
          dark: data.idmTheme.logo,
          ...(data.idmTheme.logoHeight && { height: data.idmTheme.logoHeight }),
        },
      }),
    });
  }

  return data;
};
