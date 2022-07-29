<script lang="ts">
  import { onMount } from 'svelte';

  import Widget, { modal, journey, user } from '../../../../package/modal';

  let userResponse: any | null;
  let widget: Widget;
  let widgetEl: HTMLDivElement;

  async function logout() {
    await user.logout();
    userResponse = null;
  }

  modal.onMount((dialog: HTMLDialogElement, form: HTMLFormElement) => {
    console.log(dialog);
    console.log(form);

    journey.start();
  });
  journey.onSuccess((response: any) => {
    console.log(response);
    userResponse = response?.user;
  });
  journey.onFailure((error: string | null) => {
    console.log('Singleton onFailure event fired');
    console.log(error);
  });

  onMount(async () => {
    let content;
    /**
     * Reuse translated content from locale api if not en-US
     */
    if (navigator.language !== 'en-US') {
      const response = await fetch(`${window.location.origin}/api/locale`);
      content = response.ok && (await response.json());
    }

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
        content,
        customStyles: {
          buttons: {
            // primary: [
            //   { key: 'color', value: '#000000' },
            //   { key: 'background-color', value: '#bada55' },
            //   { key: 'border-color', value: '#bada55' },
            // ],
          },
        },
      },
    });

    console.log(widget);
  });
</script>

<div class="tw_p-6">
  {#if userResponse?.successful}
    <ul>
      <li id="fullName">
        <strong>Full name</strong>: {`${userResponse.info?.given_name} ${userResponse.info?.family_name}`}
      </li>
      <li id="email"><strong>Email</strong>: {userResponse.info?.email}</li>
    </ul>
    <button on:click={logout}>Logout</button>
  {:else}
    <button on:click={() => modal.open()}>Open Login Modal</button>
  {/if}
</div>
<div bind:this={widgetEl} />
