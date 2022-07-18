<script lang="ts">
  import { onMount as s_onMount } from 'svelte';

  import type { User } from '$journey/interfaces';
  import Widget, { modal, journey, user } from '../../../../package/modal';

  let userInfo: User | null;
  let widget: Widget;
  let widgetEl: HTMLDivElement;

  async function logout() {
    await user.logout();
    userInfo = null;
  }

  modal.onMount((dialog: HTMLDialogElement) => {
    console.log('Singleton onMount event fired');
    console.log(dialog);

    journey.initialize();
  });
  journey.onSuccess((response: User) => {
    console.log('Singleton onSuccess event fired');
    userInfo = response;
  });
  journey.onFailure((error: string | null) => {
    console.log('Singleton onFailure event fired');
    console.log(error);
  });

  s_onMount(() => {
    widget = new Widget({
      target: widgetEl,
      props: {
        config: {
          clientId: 'WebOAuthClient',
          redirectUri: `${window.location.origin}/callback`,
          scope: 'openid profile email me.read',
          serverConfig: {
            baseUrl: 'https://openam-crbrl-01.forgeblocks.com/am/',
          },
          realmPath: 'alpha',
          tree: 'Login',
        },
        customStyles: {
          button: [
            { key: 'color', value: '#000000' },
            { key: 'background-color', value: '#bada55' },
            { key: 'border-color', value: '#bada55' },
          ],
        },
      },
    });

    console.log(widget);
  });

  $: if (userInfo) console.log(userInfo);
</script>

<div class="tw_p-6">
  {#if userInfo?.isAuthenticated}
    <ul>
      <li id="fullName"><strong>Full name</strong>: {userInfo.fullName}</li>
      <li id="email"><strong>Email</strong>: {userInfo.email}</li>
    </ul>
    <button on:click={logout}>Logout</button>
  {:else}
    <button on:click={() => modal.open({ initialized: true })}>Open Login Modal</button>
  {/if}
</div>
<div bind:this={widgetEl} />
