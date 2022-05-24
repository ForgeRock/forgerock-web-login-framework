<script>
  import { onMount as s_onMount } from 'svelte';

  import Button from '$lib/components/primitives/button/button.svelte';
  import Widget, { modal, journey } from '../../../package/widget';

  let target;

  modal.onMount((component) => console.log(component));
  journey.onSuccess((user) => console.log(user));
  journey.onFailure((error) => console.log(error));

  s_onMount(() => {
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
      }
    });
  });
</script>

<div class="tw_p-6">
  <Button onClick={() => modal.open()} style="primary">Login</Button>
</div>
<div bind:this={target}></div>
