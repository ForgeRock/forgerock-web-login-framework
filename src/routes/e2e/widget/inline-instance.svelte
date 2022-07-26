<script lang="ts">
  /**
   * Currently not working properly
   *
   * This was just a test to prove out the idea.
   */
  import { onMount } from 'svelte';

  import Button from '$lib/components/primitives/button/button.svelte';
  import type { User } from '$journey/interfaces';
  import Widget, { form, journey, user } from '../../../../package/inline';

  let formEl: HTMLDivElement;
  let userInfo: User | null;
  let widget;

  async function logout() {
    await user.logout();
    userInfo = null;
  }

  onMount(() => {
    // TODO: Add method to refresh form
    widget = new Widget({
      target: formEl,
      props: {
        config: {
          clientId: 'WebOAuthClient',
          redirectUri: `${window.location.origin}/callback`,
          scope: 'openid profile email me.read',
          serverConfig: {
            baseUrl: 'https://openam-crbrl-01.forgeblocks.com/am/'
          },
          realmPath: 'alpha',
          tree: 'Login',
        },
      }
    });

    widget.$on('form-mount', (widgetEl: HTMLElement) => {
      console.log('Instance mount event fired');
      console.log(widgetEl)
    });
    widget.$on('journey-success', (response: User) => {
      console.log('Instance success event fired');
      (userInfo = response)
    });
    widget.$on('journey-failure', (error: string) => {
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
