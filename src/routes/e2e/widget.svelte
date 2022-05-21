<script>
  import { onMount } from 'svelte';

  import Button from '$lib/components/primitives/button/button.svelte';
  import Widget, { showModal, onSuccess } from '../../../package/widget';

  let target;

  onSuccess((user) => console.log(user));

  onMount(() => {
    new Widget({
      target,
      props: {
        config: {
          clientId: 'WebOAuthClient',
          redirectUri: 'https://localhost:3000/callback',
          scope: 'openid profile me.read',
          serverConfig: {
            baseUrl: 'https://openam-crbrl-01.forgeblocks.com/am/'
          },
          realmPath: 'alpha',
          tree: 'Login',
        },
        mounted: () => {
          console.log('ForgeRock Login Widget is mounted');
        }
      }
    });
  });
</script>

<div class="m-6">
  <Button onClick={() => showModal()} style="primary">Login</Button>
</div>
<div bind:this={target}></div>
