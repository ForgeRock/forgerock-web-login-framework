<script lang="ts">
  import { onMount } from 'svelte';

  import { configuration, user } from '$package/modal';

  let loading: any;
  let userInfo: any;

  async function logout() {
    await user.logout();
    userInfo = null;
  }

  onMount(async () => {
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
      }
    });

    // Using observable method:
    const { get, subscribe } = user.info();
    get();
    subscribe((event) => {
      console.log(event);
      loading = event.loading;
      userInfo = event.response;
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
    <button on:click={logout}>Logout</button>
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
  <p>Loading ... </p>
{/if}


