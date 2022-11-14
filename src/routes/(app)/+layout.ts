import configure from '$lib/config';
import { initialize as initializeLinks } from '$lib/links.store';

import '../../app.css';

configure({
  clientId: 'WebOAuthClient',
  // redirectUri: 'https://crbrl.ngrok.io/callback',
  redirectUri: 'https://localhost:3000/callback',
  scope: 'openid profile me.read',
  serverConfig: {
    baseUrl: 'https://openam-crbrl-01.forgeblocks.com/am/',
    // baseUrl: 'https://crbrl.ngrok.io/proxy/',
    timeout: 5000,
  },
  realmPath: 'alpha',
});

initializeLinks({
  termsAndConditions: 'https://www.forgerock.com/terms',
});
