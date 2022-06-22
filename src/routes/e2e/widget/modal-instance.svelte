<script lang="ts">
  /**
   * Currently not working properly.
   *
   * This was just a test to prove out the idea.
   */
  import { onMount as s_onMount } from 'svelte';

  import Button from '$lib/components/primitives/button/button.svelte';
  import Widget, { user } from '../../../../package/modal';

  let userInfo = {};
  let widget1;
  let widget2;
  let widgetEl1;
  let widgetEl2;

  async function logout() {
    await user.logout();
    userInfo = {};
  }

  s_onMount(() => {
    widget1 = new Widget({
      target: widgetEl1,
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

    widget2 = new Widget({
      target: widgetEl2,
      props: {
        config: {
          clientId: 'WebOAuthClient',
          redirectUri: 'https://localhost:3000/callback',
          scope: 'openid profile email me.read',
          serverConfig: {
            baseUrl: 'https://openam-crbrl-01.forgeblocks.com/am/'
          },
          realmPath: 'alpha',
          tree: 'Register',
        },
      }
    });

    widget1.$on('modal-mount', (widgetEl) => {
      console.log('Instance 1 mount event fired');
      console.log(widgetEl)
    });
    widget1.$on('journey-success', (response) => {
      console.log('Instance 1 success event fired');
      (userInfo = response)
    });
    widget1.$on('journey-failure', (error) => {
      console.log('Instance 1 failure event fired');
      console.log(error)
    });

    widget1.$on('modal-mount', (widgetEl) => {
      console.log('Instance 2 mount event fired');
      console.log(widgetEl)
    });
    widget1.$on('journey-success', (response) => {
      console.log('Instance 2 success event fired');
      (userInfo = response)
    });
    widget1.$on('journey-failure', (error) => {
      console.log('Instance 2 failure event fired');
      console.log(error)
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
    <Button onClick={() => widget1.$set({ open: true })} style="primary">Login</Button>
    <Button onClick={() => widget2.$set({ open: true })} style="primary">Register</Button>
  {/if}
</div>
<div bind:this={widgetEl1}></div>
<div bind:this={widgetEl2}></div>
