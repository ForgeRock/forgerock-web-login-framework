<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  import Widget, { modal, journey, user } from '$package/modal';

  let journeyParam = $page.url.searchParams.get('journey');
  // TODO: Use a more specific type
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

    // Calling this on mount is not good if using HMR as it results in a ton of requests on change
    // journey.start();
  });
  // TODO: Use a more specific type
  journey.onSuccess((response: any) => {
    console.log(response);
    userResponse = response?.user;
  });
  journey.onFailure((error: string | null) => {
    console.log('Singleton onFailure event fired');
    console.log(error);
  });

  modal.onClose((args: { reason: string }) =>
    console.log(`Modal closed due to ${args && args.reason}`),
  );

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
            timeout: 5000,
          },
          realmPath: 'alpha',
          tree: journeyParam || 'Login',
        },
        content,
        style: {
          labels: 'floating',
          logo: {
            dark: '/img/fr-logomark-white.png',
            light: '/img/fr-logomark-black.png',
          },
          sections: {
            header: true,
          },
        },
      },
    });
  });
</script>

<div class="tw_p-6">
  {#if userResponse?.successful}
    <ul>
      <li id="fullName">
        <strong>Full name</strong>: {`${userResponse.response?.given_name} ${userResponse.response?.family_name}`}
      </li>
      <li id="email"><strong>Email</strong>: {userResponse.response?.email}</li>
    </ul>
    <button on:click={logout}>Logout</button>
  {:else}
    <button on:click={() => modal.open()}>Open Login Modal</button>
  {/if}
</div>
<div bind:this={widgetEl} />
