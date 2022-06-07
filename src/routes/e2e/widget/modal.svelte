<script lang="ts">
  import { onMount as s_onMount } from 'svelte';

  import Button from '$lib/components/primitives/button/button.svelte';
  import Widget, { modal, journey, user } from '../../../../package/modal';

  let userInfo = {};
  let widget;
  let widgetEl;

  async function logout() {
    await user.logout();
    userInfo = {};
  }

  modal.onMount((widgetEl) => {
    console.log('Singleton onMount event fired');
    console.log(widgetEl)
  });
  journey.onSuccess((response) => {
    console.log('Singleton onSuccess event fired');
    (userInfo = response)
  });
  journey.onFailure((error) => {
    console.log('Singleton onFailure event fired');
    console.log(error)
  });

  s_onMount(() => {
    widget = new Widget({
      target: widgetEl,
      props: {
        config: {
          clientId: 'WebOAuthClient',
          redirectUri: 'https://localhost:3000/callback',
          scope: 'openid profile email me.read',
          serverConfig: {
            baseUrl: 'https://openam-crbrl-01.forgeblocks.com/am/'
          },
          realmPath: 'alpha',
          tree: 'Registration',
        },
      }
    });
  });

  $: if (userInfo) console.log(userInfo);
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
<div bind:this={widgetEl}></div>
