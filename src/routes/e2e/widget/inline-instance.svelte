<script lang="ts">
  /**
   * Currently not working properly
   *
   * This was just a test to prove out the idea.
   */
  import { onMount as s_onMount } from 'svelte';

  import Button from '$lib/components/primitives/button/button.svelte';
  import Widget, { form, journey, user } from '../../../../package/inline';

  let formEl;
  let userInfo = {};
  let widget;

  async function logout() {
    await user.logout();
    userInfo = {
      isAuthenticated: false,
    };
  }

  s_onMount(() => {
    // TODO: Add method to refresh form
    widget = new Widget({
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

    widget.$on('form-mount', (widgetEl) => {
      console.log('Instance mount event fired');
      console.log(widgetEl)
    });
    widget.$on('journey-success', (response) => {
      console.log('Instance success event fired');
      (userInfo = response)
    });
    widget.$on('journey-failure', (error) => {
      console.log('Instance failure event fired');
      console.log(error)
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
