import configure from '$lib/sdk.config';
import { initialize as initializeJourneys } from '$journey/config.store';
import { initialize as initializeLinks } from '$lib/links.store';

import '../../app.css';
import { browser } from '$app/environment';

configure({
  clientId: 'WebOAuthClient',
  // redirectUri: 'https://crbrl.ngrok.io/callback',
  redirectUri: `${browser ? window.location.origin : 'https://placeholder.com'}/callback`,
  scope: 'openid profile me.read',
  serverConfig: {
    baseUrl: 'https://openam-crbrl-01.forgeblocks.com/am/',
    // baseUrl: 'https://crbrl.ngrok.io/proxy/',
    timeout: 5000,
  },
  realmPath: 'alpha',
});

initializeJourneys();

initializeLinks({
  termsAndConditions: 'https://www.forgerock.com/terms',
});
