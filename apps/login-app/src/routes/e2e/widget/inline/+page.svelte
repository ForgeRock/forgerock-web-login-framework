<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { onMount } from 'svelte';

  import { page } from '$app/state';
  import Widget, { component, configure, journey, user } from '$package/index';

  import type { UserStoreValue } from '$package/types';

  type UserResponseObj = {
    family_name: string;
    given_name: string;
    email: string;
  };

  let authIndexValueParam = page.url.searchParams.get('authIndexValue');
  let journeyParam = page.url.searchParams.get('journey');
  let recaptchaParam = page.url.searchParams.get('recaptchaAction');
  const captchaModeRaw = page.url.searchParams.get('captchaMode');
  const captchaModeParam =
    captchaModeRaw === 'visible' || captchaModeRaw === 'invisible' ? captchaModeRaw : null;
  let suspendedIdParam = page.url.searchParams.get('suspendedId');
  let formEl: HTMLDivElement | undefined = $state();
  let userEvent: UserStoreValue | null = $state(null);
  let userResponse: UserResponseObj | null = $state(null);

  async function logout() {
    await user.logout();
    userEvent = null;
    userResponse = null;
  }

  onMount(async () => {
    let content;
    /**
     * Reuse translated content from locale api if not en-US
     */
    if (navigator.language !== 'en-US') {
      const response = await fetch(`${window.location.origin}/api/locale`);
      content = response.ok && (await response.json());
    }

    await configure({
      serverConfig: {
        wellknown:
          'https://openam-sdks.forgeblocks.com/am/oauth2/alpha/.well-known/openid-configuration',
      },
      captcha: captchaModeParam ? { mode: captchaModeParam } : undefined,
      oidcClient: {
        clientId: 'WebOAuthClient',
        redirectUri: `${window.location.origin}/callback`,
        scope: 'openid profile email me.read',
      },
      content,
      links: {
        termsAndConditions: 'https://www.forgerock.com/terms',
      },
    });

    const componentEvents = component();
    const journeyEvents = journey();

    componentEvents.subscribe((event) => {
      if (event.lastAction === 'mount') {
        console.log('Form mounted');
      }
    });

    journeyEvents.subscribe((event) => {
      if (event?.user?.successful) {
        userEvent = event.user;
        userResponse = event.user.response as unknown as UserResponseObj;
      }
      if (event.journey.error || event.oauth.error || event.user.error) {
        console.log('Login failure event fired');
      }
    });

    if (!formEl) return;
    new Widget({ target: formEl, props: { type: 'inline' } });
    // Start the  journey after initialization or within the form.onMount event
    journeyEvents.start({
      journey: journeyParam || authIndexValueParam || undefined,
      resumeUrl: suspendedIdParam ? location.href : undefined,
      recaptchaAction: recaptchaParam ?? undefined,
    });
  });
</script>

{#if userEvent?.successful}
  <ul>
    <li id="fullName">
      <strong>Full name</strong>: {`${userResponse?.given_name} ${userResponse?.family_name}`}
    </li>
    <li id="email"><strong>Email</strong>: {userResponse?.email}</li>
  </ul>
  <button onclick={logout}>Logout</button>
{/if}
<div bind:this={formEl} class={`${userEvent?.successful ? 'tw_hidden' : ''} tw_p-6`}></div>
