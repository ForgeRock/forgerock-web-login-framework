<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  import Widget, { form, journey, user } from '$package/inline';

  let authIndexValue = $page.url.searchParams.get('authIndexValue');
  let journeyParam = $page.url.searchParams.get('journey');
  let suspendedIdParam = $page.url.searchParams.get('suspendedId');

  let formEl: HTMLDivElement;
  // TODO: Use a more specific type
  let userResponse: any | null;

  async function logout() {
    await user.logout();
    userResponse = null;
  }

  form.onMount((component) => console.log(component));

  onMount(async () => {
    let content;
    /**
     * Reuse translated content from locale api if not en-US
     */
    if (navigator.language !== 'en-US') {
      const response = await fetch(`${window.location.origin}/api/locale`);
      content = response.ok && (await response.json());
    }

    new Widget({
      target: formEl,
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
        },
        content,
        links: {
          termsAndConditions: 'https://www.forgerock.com/terms',
        },
      },
    });

    // Start the  journey after initialization or within the form.onMount event
    const subscribe = journey.start({
      journey: journeyParam || authIndexValue || undefined,
      resumeUrl: suspendedIdParam ? location.href : undefined,
    });

    subscribe((response: any) => {
      console.log(response);
      userResponse = response?.user;
    });
  });
</script>

{#if userResponse?.successful}
  <ul>
    <li id="fullName">
      <strong>Full name</strong>: {`${userResponse.response?.given_name} ${userResponse.response?.family_name}`}
    </li>
    <li id="email"><strong>Email</strong>: {userResponse.response?.email}</li>
  </ul>
  <button on:click={logout}>Logout</button>
{/if}
<div bind:this={formEl} class={`${userResponse?.successful ? 'tw_hidden' : ''} tw_p-6`} />
