<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { onMount } from 'svelte';

  import { configure, user } from '$package/index';

  import type { UserStoreValue } from '$package/types';

  let loading: boolean | null = $state(null);
  let userInfo: Record<string, unknown> | null = $state(null);

  async function logout() {
    await user.logout();
    userInfo = null;
  }

  onMount(async () => {
    await configure({
      serverConfig: {
        wellknown:
          'https://openam-sdks.forgeblocks.com/am/oauth2/alpha/.well-known/openid-configuration',
      },
      oidcClient: {
        clientId: 'WebOAuthClient',
        redirectUri: `${window.location.origin}/callback`,
        scope: 'openid profile email me.read',
      },
    });

    // Using observable method:
    const { get, subscribe } = user.info();
    get();
    subscribe((event: UserStoreValue) => {
      console.log(event);
      loading = event.loading;
      userInfo = event.response as Record<string, unknown>;
    });

    // Using Promise method
    // const { get } = user.info();
    // const event = await get();
    // console.log(event);
    // userInfo = event.response;
  });
</script>

{#if !loading}
  {#if userInfo}
    <ul>
      <li id="fullName">
        <strong>Full name</strong>: {`${userInfo?.given_name} ${userInfo?.family_name}`}
      </li>
      <li id="email"><strong>Email</strong>: {userInfo?.email}</li>
    </ul>
    <button onclick={logout}>Logout</button>
  {:else}
    <ul>
      <li>
        <a href="/e2e/widget/modal">Login via Modal Widget</a>
      </li>
      <li>
        <a href="/e2e/widget/inline">Login via Inline Widget</a>
      </li>
    </ul>
  {/if}
{:else}
  <p>Loading ...</p>
{/if}
