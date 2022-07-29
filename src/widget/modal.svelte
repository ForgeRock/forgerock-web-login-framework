<script context="module" lang="ts">
  import {
    Config,
    FRUser,
    type GetTokensOptions,
    SessionManager,
    TokenManager,
    UserManager,
  } from '@forgerock/javascript-sdk';
  import type { StepOptions } from '@forgerock/javascript-sdk/lib/auth/interfaces';
  import { get } from 'svelte/store';

  // Import store types
  import type { JourneyStore, JourneyStoreValue } from '$journey/journey.store';
  import type { OAuthStore, OAuthTokenStoreValue } from '$lib/oauth/oauth.store';
  import type { UserStore, UserStoreValue } from '$lib/user/user.store';

  import './main.css';

  export interface Response {
    journey?: JourneyStoreValue;
    oauth?: OAuthTokenStoreValue;
    user?: UserStoreValue;
  }
  export interface JourneyOptions {
    config?: StepOptions;
    oauth?: boolean; // defaults to true
    user?: boolean; // defaults to true
  }

  let dialogComp: SvelteComponent;
  let dialogEl: HTMLDialogElement;
  let callMounted: (dialog: HTMLDialogElement, form: HTMLFormElement) => void;
  let journeyStore: JourneyStore;
  let oauthStore: OAuthStore;
  let returnError: (response: Response) => void;
  let returnResponse: (response: Response) => void;
  let userStore: UserStore;

  export const journey = {
    start(options?: JourneyOptions): void {
      const requestsOauth = options?.oauth || true;
      const requestsUser = options?.user || true;

      let journey: JourneyStoreValue;
      let oauth: OAuthTokenStoreValue;
      let journeyStoreUnsub = journeyStore.subscribe((response) => {
        if (!requestsOauth && response.successful) {
          returnResponse({
            journey: response,
          });
          modal.close();
        } else if (requestsOauth && response.successful) {
          journey = response;
          oauthStore.get({ forceRenew: true });
        } else if (response.error) {
          journey = response;
          returnError({
            journey: response,
          });
        }
        /**
         * Clean up unneeded subscription, but only when it's successful
         * Leaving the subscription allows for the journey to be
         * restarted internally.
         */
        if (response.successful) {
          journeyStoreUnsub();
        }
      });
      let oauthStoreUnsub = oauthStore.subscribe((response) => {
        if (!requestsUser && response.successful) {
          returnResponse({
            journey,
            oauth: response,
          });
          modal.close();
        } else if (requestsUser && response.successful) {
          oauth = response;
          userStore.get();
        } else if (response.error) {
          oauth = response;
          returnError({
            journey,
            oauth: response,
          });
        }
        /**
         * Clean up unneeded subscription, but only when it's successful
         * Leaving the subscription allows for the journey to be
         * restarted internally.
         */
        if (response.successful) {
          oauthStoreUnsub();
        }
      });
      let userStoreUnsub = userStore.subscribe((response) => {
        if (response.successful) {
          returnResponse({
            journey,
            oauth,
            user: response,
          });
          modal.close();
        } else if (response.error) {
          returnError({
            journey,
            oauth,
            user: response,
          });
        }
        /**
         * Clean up unneeded subscription, but only when it's successful
         * Leaving the subscription allows for the journey to be
         * restarted internally.
         */
        if (response.successful) {
          userStoreUnsub();
        }
      });

      journeyStore.next();
    },
    onFailure(fn: (response: Response) => void) {
      returnError = (response: Response) => fn(response);
    },
    onSuccess(fn: (response: Response) => void) {
      returnResponse = (response: Response) => fn(response);
    },
  };
  export const modal = {
    close() {
      dialogComp.closeDialog();
    },
    onMount(fn: (dialog: HTMLDialogElement, form: HTMLFormElement) => void) {
      callMounted = (dialog: HTMLDialogElement, form: HTMLFormElement) => fn(dialog, form);
    },
    open(): void {
      if (!get(journeyStore).step) {
        journeyStore.next();
      }
      dialogEl.showModal();
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
      return get(userStore).info;
    },
    async logout() {
      const { clientId } = Config.get();

      /**
       * If configuration has a clientId, then use FRUser to logout to ensure
       * token revoking and removal; else, just end the session.
       */
      if (clientId) {
        // Call SDK logout
        await FRUser.logout();
      } else {
        await SessionManager.logout();
      }

      // Reset stores
      journeyStore.reset();
      oauthStore.reset();
      userStore.reset();

      // Fetch fresh journey step
      journey.start();
    },
    async tokens(options?: GetTokensOptions) {
      return await TokenManager.getTokens(options);
    },
  };
</script>

<script lang="ts">
  import { createEventDispatcher, onMount as s_onMount, SvelteComponent } from 'svelte';

  import Dialog from '$components/compositions/dialog/dialog.svelte';
  import Journey from '$journey/journey.svelte';

  // Import the stores for initialization
  import { initialize as initializeJourney } from '$journey/journey.store';
  import { initialize as initializeContent } from '$lib/locale.store';
  import { initialize as initializeOauth } from '$lib/oauth/oauth.store';
  import { initialize as initializeUser } from '$lib/user/user.store';
  import { initialize as initializeStyles } from './styles.store';

  export let config: any;
  export let content: any;
  export let customStyles: any;

  const dispatch = createEventDispatcher();

  let _dialogComp: SvelteComponent;
  let _dialogEl: HTMLDialogElement;
  let _journeyStore = (journeyStore = initializeJourney(config));
  let _oauthStore = (oauthStore = initializeOauth(config));
  let _userStore = (userStore = initializeUser(config));
  let formEl: HTMLFormElement;

  initializeContent(content, true);
  initializeStyles(customStyles);

  Config.set(config);

  s_onMount(() => {
    dialogComp = _dialogComp;
    dialogEl = _dialogEl;

    /**
     * Call mounted event for Singleton users
     */
    callMounted && callMounted(_dialogEl, formEl);
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
</script>

<div class="fr_widget-root">
  <Dialog bind:dialogEl={_dialogEl} bind:this={_dialogComp} dialogId="sampleDialog">
    <Journey bind:formEl journeyStore={_journeyStore} />
  </Dialog>
</div>
