<script lang="ts">
  import { onMount } from 'svelte';

  import Button from '$lib/components/primitives/button/button.svelte';
  import type { User } from '$journey/interfaces';
  import Widget, { form, journey, user } from '../../../../package/inline';

  let formEl: HTMLDivElement;
  let userInfo: User | null;

  async function logout() {
    await user.logout();
    userInfo = null;
  }

  form.onMount((component: HTMLElement) => console.log(component));
  journey.onSuccess((response: User) => (userInfo = response));
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
            baseUrl: 'https://openam-crbrl-01.forgeblocks.com/am/'
          },
          realmPath: 'alpha',
          tree: 'Login',
        },
        content,
      }
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
