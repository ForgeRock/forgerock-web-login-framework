<script lang="ts">
  import { onMount as s_onMount } from 'svelte';

  import Button from '$lib/components/primitives/button/button.svelte';
  import Widget, { form, journey, user } from '../../../../package/inline';

  let formEl;
  let userInfo = {};

  async function logout() {
    await user.logout();
    userInfo = {
      isAuthenticated: false,
    };
  }

  form.onMount((component) => console.log(component));
  journey.onSuccess((response) => (userInfo = response));
  journey.onFailure((error) => console.log(error));

  s_onMount(() => {
    // TODO: Add method to refresh form
    new Widget({
      target: formEl,
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
</script>

{#if userInfo?.isAuthenticated}
  <ul>
    <li id="fullName"><strong>Full name</strong>: {userInfo.fullName}</li>
    <li id="email"><strong>Email</strong>: {userInfo.email}</li>
  </ul>
  <Button onClick={logout} style="primary">Logout</Button>
{/if}
<div bind:this={formEl} class={`${userInfo?.isAuthenticated ? 'tw_hidden' : ''} tw_p-6`}></div>
