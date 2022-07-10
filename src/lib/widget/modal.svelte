<script context="module" lang="ts">
  import { FRUser, TokenManager, UserManager } from '@forgerock/javascript-sdk';

  import type { User } from '$journey/interfaces';
  import Journey from '../journey/journey.svelte';
  import { email, isAuthenticated, fullName } from '../user/user.store';
  import { initStyles } from './styles.store';

  import './main.css';

  let dialogComp: SvelteComponent;
  let dialogEl: HTMLDialogElement;
  let callMounted: (component: HTMLDialogElement) => void;
  let journeyComp: SvelteComponent;
  let returnError: (error: string | null) => void;
  let returnUser: (user: User) => void;

  export const journey = {
    initialize(options?: { journey?: string }): void {
      journeyComp.initJourney(options?.journey);
    },
    onFailure(fn: (error: string | null) => void) {
      returnError = (error: string | null) => fn(error);
    },
    onSuccess(fn: (user: User) => void) {
      returnUser = (user: User) => fn(user);
    },
  };
  export const modal = {
    close() {
      dialogComp.closeDialog();
    },
    onMount(fn: (component: HTMLDialogElement) => void) {
      callMounted = (component: HTMLDialogElement) => fn(component);
    },
    open(options?: { initialized?: boolean; journey?: string }): void {
      let { initialized } = options || {};
      !initialized && journeyComp.initJourney(journey);
      dialogEl.showModal();
    },
  };
  export const user = {
    async authorized(remote = false): Promise<boolean> {
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
    async logout(): Promise<void> {
      await FRUser.logout();
      email.set('');
      fullName.set('');
      isAuthenticated.set(false);
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

  import Dialog from '../components/compositions/dialog/dialog.svelte';

  export let config: any;
  export let open = false;
  export let customStyles: any;

  export function initializeJourney(tree: string) {
    _journeyComp.initializeJourney(tree);
  }

  const dispatch = createEventDispatcher();

  let _dialogComp: SvelteComponent;
  let _dialogEl: HTMLDialogElement;
  let _journeyComp: SvelteComponent;

  s_onMount(() => {
    dialogComp = _dialogComp;
    dialogEl = _dialogEl;
    journeyComp = _journeyComp;

    /**
     * Call mounted event for Singleton users
     */
    callMounted && callMounted(_dialogEl);
    /**
     * Call mounted event for Instance users
     * NOTE: needs to be wrapped in setTimeout. Asked in Svelte Discord
     * if this is an issue or expected. Answer: Object instantiation seems
     * to be synchronous, so this doesn't get called without `setTimeout`.
     */
    setTimeout(() => {
      dispatch('modal-mount', 'Modal mounted');
    }, 0);
  });

  // TODO: Rethink setting root config at component level to fix instances
  Config.set(config);
  initStyles(customStyles);
</script>

<div class="fr_widget-root">
  <Dialog bind:dialogEl={_dialogEl} bind:this={_dialogComp} dialogId="sampleDialog">
    <Journey
      bind:this={_journeyComp}
      widgetDispatch={dispatch}
      closeModal={modal.close}
      {returnError}
      {returnUser}
    />
  </Dialog>
</div>
