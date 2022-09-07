<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  import Widget, { form, journey, user } from '$package/inline';

  let journeyParam = $page.url.searchParams.get('journey');
  let formEl: HTMLDivElement;
  let userResponse: any | null;

  async function logout() {
    await user.logout();
    userResponse = null;
  }

  form.onMount((component: HTMLElement) => console.log(component));
  journey.onSuccess((response: any) => (userResponse = response?.user));
  journey.onFailure((error: string) => console.log(error));

  onMount(async () => {
    let content;
    /**
     * Reuse translated content from locale api if not en-US
     */
    if (navigator.language !== 'en-US') {
      const response = await fetch(`${window.location.origin}/api/locale`);
      content = response.ok && (await response.json());
    }
    // TODO: Add method to refresh form
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
          tree: journeyParam || 'Login',
        },
        content,
      },
    });
    // Start the  journey after initialization or within the form.onMount event
    journey.start();
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
