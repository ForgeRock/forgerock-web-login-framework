<script context="module" lang="ts">
  import { FRUser, TokenManager, UserManager } from '@forgerock/javascript-sdk';

  import Journey, { initJourney } from '../journey/journey.svelte';
  import { email, isAuthenticated, fullName } from '../user/user.store';

  import './main.css';

  let component;
  let callMounted;
  let returnError;
  let returnUser;

  export const journey = {
    onFailure(fn) {
      returnError = (error) => fn(error);
    },
    onSuccess(fn) {
      returnUser = (user) => fn(user);
    },
  };
  export const form = {
    onMount(fn) {
      callMounted = (component) => fn(component);
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
      initJourney();
    },
    async tokens(renew = false) {
      // TODO: decide what options to provide to client
      return await TokenManager.getTokens();
    },
  };
</script>

<script lang="ts">
  import { Config } from '@forgerock/javascript-sdk';
  import { createEventDispatcher, onMount as s_onMount } from 'svelte';

  export let config;

  const dispatch = createEventDispatcher();

  let formEl;

  s_onMount(() => {
    component = formEl;
    initJourney();
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
  <Journey widgetDispatch={dispatch} {returnError} {returnUser} />
</div>
