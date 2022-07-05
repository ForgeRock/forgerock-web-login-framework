<script context="module" lang="ts">
  import { FRUser, TokenManager, UserManager } from '@forgerock/javascript-sdk';

  import type { User } from '$journey/interfaces';
  import Journey, { initJourney } from '../journey/journey.svelte';
  import { email, isAuthenticated, fullName } from '../user/user.store';
  import { initStyles } from './styles.store';


  import './main.css'

  let dialog: HTMLDialogElement;
  let callMounted: (component: HTMLDialogElement) => void;
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
  export const modal = {
    close() {
      dialog?.close();
    },
    onMount(fn: (component: HTMLDialogElement) => void) {
      callMounted = (component: HTMLDialogElement) => fn(component);
    },
    open() {
      initJourney();
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
      email.set('');
      fullName.set('');
      isAuthenticated.set(false);
    },
    async tokens(renew = false) {
      // TODO: decide what options to provide to client
      return await TokenManager.getTokens();
    },
  }
</script>

<script lang="ts">
  import { Config } from '@forgerock/javascript-sdk';
  import { createEventDispatcher, onMount as s_onMount } from 'svelte';

  import Dialog from '../components/compositions/dialog/dialog.svelte';
  import KeyIcon from '../components/icons/key-icon.svelte';

  export let config: any;
  export let open = false;
  export let customStyles: any;

  const dispatch = createEventDispatcher();

  let dialogEl: HTMLDialogElement;
  let mounted = false;

  s_onMount(() => {
    dialog = dialogEl;
    /**
     * Call mounted event for Singleton users
     */
    callMounted && callMounted(dialogEl);
    /**
     * Call mounted event for Instance users
     * NOTE: needs to be wrapped in setTimeout. Asked in Svelte Discord
     * if this is an issue or expected.
     */
    setTimeout(() => {
      dispatch('modal-mount', 'Modal mounted');
    }, 0);
    mounted = true;
  });

  // TODO: Rethink setting root config at component level to fix instances
  Config.set(config);
  initStyles(customStyles);

  $: {
    /**
     * This is a reactive block for Widget Instance users.
     * Setting `open` to `true` is their control.
     *
     * TODO: currently broken as state isn't completely managed internally
    */
    if (mounted && open) {
      initJourney(null);
      dialogEl.showModal();
    } else if (mounted && !open) {
      dialogEl.close();
    }
  }
</script>

<div class="fr_widget-root">
  <Dialog bind:dialogEl dialogId="sampleDialog">
    <div class="tw_flex w-full tw_justify-center">
      <KeyIcon classes="tw_text-gray-400 tw_fill-current tw_mb-3" size="72px">Key Icon</KeyIcon>
    </div>
    <h2 class="tw_flex tw_font-light tw_justify-center tw_mb-6 tw_text-4xl tw_text-primary">Sign In</h2>
    <Journey widgetDispatch={dispatch} closeModal={modal.close} {returnError} {returnUser} />
  </Dialog>
</div>
