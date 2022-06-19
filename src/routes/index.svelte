<script>
  import { Config } from '@forgerock/javascript-sdk';
  import Form, { initForm } from '../lib/journey/form.svelte';
  import KeyIcon from '../lib/components/icons/key-icon.svelte';
  import { onMount } from 'svelte';

  Config.set({
    clientId: 'WebOAuthClient',
    // redirectUri: 'https://crbrl.ngrok.io/callback',
    redirectUri: 'https://localhost:3000/callback',
    scope: 'openid profile me.read',
    serverConfig: {
      baseUrl: 'https://openam-crbrl-01.forgeblocks.com/am/',
      // baseUrl: 'https://crbrl.ngrok.io/proxy/',
      timeout: 3000, // 90000 or less
      // paths: {
      //   authenticate: 'authenticate',
      //   authorize: 'authorize',
      //   accessToken: 'access-token',
      //   endSession: 'end-session',
      //   userInfo: 'userinfo',
      //   revoke: 'revoke',
      //   sessions: 'sessions',
      // },
    },
    realmPath: 'alpha',
    tree: 'Registration',
  });

  onMount(() => {
    initForm();
  });
</script>

<div class="tw_bg-body-light dark:tw_bg-body-dark tw_flex tw_justify-center tw_min-h-full">
  <div class="tw_containing-box dark:tw_containing-box_dark">
    <div class="tw_flex tw_justify-center">
      <KeyIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
    </div>
    <h1 class="tw_primary-header dark:tw_primary-header_dark">Sign In</h1>
    <Form />
  </div>
</div>
