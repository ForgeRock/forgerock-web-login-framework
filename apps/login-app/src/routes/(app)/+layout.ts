/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import '../../app.css';
import { initialize as initializeLinks } from '$core/links.store';
import { initialize as initializeStyles } from '$core/style.store';
import { initialize as initializeJourneys } from '$journey/config.store';

import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ data, url }) => {
  initializeJourneys();

  initializeLinks({
    termsAndConditions: 'https://www.forgerock.com/terms',
  });

  // E2E/dev toggle, mirroring the captchaMode URL param on the login page:
  // suppress script-type text output (TextOutputCallback messageType 4)
  const hideScriptedTextOutput = url.searchParams.get('hideScriptedTextOutput') === 'true';

  if (data.idmTheme || data.themeCatalog || hideScriptedTextOutput) {
    initializeStyles({
      ...(data.idmTheme && { theme: data.idmTheme }),
      ...(data.themeCatalog && { themeCatalog: data.themeCatalog }),
      ...(data.idmTheme?.logo && {
        logo: {
          light: data.idmTheme.logo,
          dark: data.idmTheme.logo,
          ...(data.idmTheme.logoHeight && { height: data.idmTheme.logoHeight }),
        },
      }),
      ...(hideScriptedTextOutput && { callbacks: { textOutput: { script: 'hidden' } } }),
    });
  }

  return data;
};
