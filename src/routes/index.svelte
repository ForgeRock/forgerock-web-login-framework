<script context="module" lang="ts">
  import Box from '$components/primitives/box/centered.svelte';
  import configure from '$lib/config/config';
  import { initTree, type InitObject } from '$journey/journey.store';

  configure({
    clientId: 'WebOAuthClient',
    // redirectUri: 'https://crbrl.ngrok.io/callback',
    redirectUri: 'https://localhost:3000/callback',
    scope: 'openid profile me.read',
    serverConfig: {
      baseUrl: 'https://openam-crbrl-01.forgeblocks.com/am/',
      // baseUrl: 'https://crbrl.ngrok.io/proxy/',
    },
    realmPath: 'alpha',
    tree: 'Login',
  });

  export async function load() {
    let initObj = await initTree(null);

    return {
      props: { initObj },
    }
  }
</script>

<script lang="ts">
  import Journey from '../lib/journey/journey.svelte';
  import KeyIcon from '../lib/components/icons/key-icon.svelte';

  export let initObj: InitObject;
</script>

<Box>
  <div class="tw_flex tw_justify-center">
    <KeyIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
  </div>
  <h1 class="tw_primary-header dark:tw_primary-header_dark">Sign In</h1>
  <Journey {initObj} />
</Box>
