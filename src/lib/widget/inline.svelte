<script context="module" lang="ts">
  import { FRUser, TokenManager, UserManager } from '@forgerock/javascript-sdk';

  import Form, { initForm } from '../journey/form.svelte';
  import { email, isAuthenticated, fullName } from '../user/user.store';

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
      initForm();
    },
    async tokens(renew = false) {
      // TODO: decide what options to provide to client
      return await TokenManager.getTokens();
    },
  }
</script>

<script lang="ts">
  import { Config } from '@forgerock/javascript-sdk';
  import { onMount as s_onMount } from 'svelte';

  export let config;

  let componentEl;

  s_onMount(() => {
    component = componentEl;
    initForm();
    callMounted && callMounted(componentEl);
  });

  Config.set(config);
</script>

<Form {returnError} {returnUser} />
