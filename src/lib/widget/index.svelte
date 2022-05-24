<script context="module" lang="ts">
  import { FRUser, TokenManager, UserManager } from '@forgerock/javascript-sdk';

  import Form, { initForm } from '../journey/form.svelte';

  let dialog;
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
  export const modal = {
    close() {
      dialog.close();
    },
    onMount(fn) {
      callMounted = (component) => fn(component);
    },
    open() {
      initForm();
      dialog.showModal();
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

  import Dialog from '../components/compositions/dialog/dialog.svelte';
  import KeyIcon from '../components/icons/key-icon.svelte';

  export let config;

  let dialogEl;

  s_onMount(() => {
    dialog = dialogEl;
    callMounted && callMounted(dialogEl);
  });

  Config.set(config);
</script>

<Dialog bind:dialogEl>
  <div class="tw_flex w-full tw_justify-center">
    <KeyIcon classes="tw_text-gray-light tw_fill-current tw_mb-4" size="72px">Key Icon</KeyIcon>
  </div>
  <h2 class="tw_flex tw_font-light tw_justify-center tw_mb-4 tw_text-4xl tw_text-gray">Sign In</h2>
  <Form closeModal={modal.close} {returnError} {returnUser} />
</Dialog>
