<script context="module" lang="ts">
  import { FRUser, TokenManager, UserManager } from '@forgerock/javascript-sdk';

  import type { User } from '$journey/interfaces';
  import Journey from '../journey/journey.svelte';
  import { email, isAuthenticated, fullName } from '../user/user.store';

  import './main.css';

  let formComp: SvelteComponent;
  let formEl: HTMLFormElement;
  let callMounted: (component: HTMLFormElement) => void;
  let returnError: (error: string | null) => void;
  let returnUser: (user: User) => void;

  export const journey = {
    onFailure(fn: (error: string | null) => void) {
      returnError = (error: string | null) => fn(error);
    },
    onSuccess(fn: (user: User) => void) {
      returnUser = (user: User) => fn(user);
    },
  };
  export const form = {
    onMount(fn: (component: HTMLFormElement) => void) {
      callMounted = (component: HTMLFormElement) => fn(component);
    },
  };
  export const user = {
    async authorized(remote = false) {
      if (remote) {
        return !!(await UserManager.getCurrentUser());
      }
      return !!(await TokenManager.getTokens());
    },
    async info(remote = false) {
      if (remote) {
        return await UserManager.getCurrentUser();
      }
      // TODO: return user info from local store
    },
    async logout() {
      await FRUser.logout();
      email.set('');
      fullName.set('');
      isAuthenticated.set(false);
      formComp.initJourney();
    },
    async tokens(renew = false) {
      // TODO: decide what options to provide to client
      return await TokenManager.getTokens();
    },
  };
</script>

<script lang="ts">
  import { Config } from '@forgerock/javascript-sdk';
  import { createEventDispatcher, onMount as s_onMount, SvelteComponent } from 'svelte';

  import { initializeContent } from '$lib/locale.store';

  export let config;

  const dispatch = createEventDispatcher();

  let _formComp: SvelteComponent;
  let _formEl: HTMLFormElement;

  initializeContent(config.content, true);

  s_onMount(() => {
    formComp = _formComp;
    formEl = _formEl;
    _formComp.initJourney();
    /**
     * Call mounted event for Singleton users
     */
    callMounted && callMounted(formEl);
    /**
     * Call mounted event for Instance users
     * NOTE: needs to be wrapped in setTimeout. Asked in Svelte Discord
     * if this is an issue or expected.
     */
    setTimeout(() => {
      dispatch('form-mount', formEl);
    }, 0);
  });

  Config.set(config);
</script>

<div class="fr_widget-root">
  <Journey bind:formEl bind:this={_formComp} widgetDispatch={dispatch} {returnError} {returnUser} />
</div>
