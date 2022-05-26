<script lang="ts">
  import { onMount as s_onMount } from 'svelte';

  import Button from '$lib/components/primitives/button/button.svelte';
  import Widget, { modal, journey, user } from '../../../package/widget';

  let userInfo = {};

  async function logout() {
    await user.logout();
    userInfo = {};
  }

  modal.onMount((component) => console.log(component));
  journey.onSuccess((response) => (userInfo = response));
  journey.onFailure((error) => console.log(error));

  s_onMount(() => {
    new Widget({
      target: document.getElementById('login-widget'),
      props: {
        config: {
          clientId: 'WebOAuthClient',
          redirectUri: 'https://localhost:3000/callback',
          scope: 'openid profile email me.read',
          serverConfig: {
            baseUrl: 'https://openam-crbrl-01.forgeblocks.com/am/'
          },
          realmPath: 'alpha',
          tree: 'Login',
        },
      }
    });
  });

  $: console.log(userInfo);
</script>

<div class="tw_p-6">
  {#if userInfo?.isAuthenticated}
    <ul>
      <li id="fullName"><strong>Full name</strong>: {userInfo.fullName}</li>
      <li id="email"><strong>Email</strong>: {userInfo.email}</li>
    </ul>
    <Button onClick={logout} style="primary">Logout</Button>
  {:else}
    <Button onClick={() => modal.open()} style="primary">Login</Button>
  {/if}
</div>
