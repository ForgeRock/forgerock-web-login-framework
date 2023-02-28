<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  import Widget, { configuration, modal, journey, user } from '$package/modal';

  import type { Maybe } from '$lib/interfaces';

  let authIndexValue = $page.url.searchParams.get('authIndexValue');
  let journeyParam = $page.url.searchParams.get('journey');
  let suspendedIdParam = $page.url.searchParams.get('suspendedId');

  // TODO: Use a more specific type
  let journeyStore;
  let userResponse: any | null;
  let journeyEvents: Maybe<any> = null;
  let widget: Widget;
  let widgetEl: HTMLDivElement;

  async function logout() {
    await user.logout();
    userResponse = null;
  }

  // TODO: Investigate why the parameter types are needed here
  modal.onMount((dialog: HTMLDialogElement, form: HTMLFormElement) => {
    console.log(dialog);
    console.log(form);
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

    configuration().set({
      config: {
        clientId: 'WebOAuthClient',
        redirectUri: `${window.location.origin}/callback`,
        scope: 'openid profile email me.read',
        serverConfig: {
          baseUrl: 'https://openam-crbrl-01.forgeblocks.com/am/',
          timeout: 5000,
        },
        realmPath: 'alpha',
      },
      content,
      links: {
        termsAndConditions: 'https://www.forgerock.com/terms',
      },
      style: {
        labels: 'floating',
        logo: {
          dark: '/img/fr-logomark-white.png',
          light: '/img/fr-logomark-black.png',
        },
        sections: {
          header: false,
        },
      }
    });

    widget = new Widget({ target: widgetEl });

    // Start the  journey after initialization or within the form.onMount event
    journeyEvents = journey();
    journeyEvents.subscribe((event: any) => {
      console.log(event);
      userResponse = event?.user;
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
    <button on:click={() => {
        journeyEvents?.start({
          journey: journeyParam || authIndexValue || undefined,
          resumeUrl: suspendedIdParam ? location.href : undefined,
        });
        modal.open();
      }
      }> Open Login Modal </button>
  {/if}
</div>
<div bind:this={widgetEl} />
