<script context="module" lang="ts">
  import {
    Config,
    FRUser,
    type GetTokensOptions,
    SessionManager,
    TokenManager,
    UserManager,
    HttpClient,
    type ConfigOptions,
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
  export const request = HttpClient.request;
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
      return get(userStore).response;
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
  import { browser } from '$app/env';
  import type { z } from 'zod';

  import { createEventDispatcher, onMount as s_onMount, SvelteComponent } from 'svelte';

  import Dialog from '$components/compositions/dialog/dialog.svelte';
  import Journey from '$journey/journey.svelte';
  import type { partialStringsSchema } from '$lib/locale.store';

  // Import the stores for initialization
  import { initialize as initializeJourney } from '$journey/journey.store';
  import { initialize as initializeContent } from '$lib/locale.store';
  import { initialize as initializeOauth } from '$lib/oauth/oauth.store';
  import { initialize as initializeUser } from '$lib/user/user.store';
  // import { initialize as initializeStyles } from './styles.store';

  export let config: ConfigOptions;
  export let content: z.infer<typeof partialStringsSchema>;
  // TODO: Runtime customization needs further development
  // export let customStyles: any;

  const dispatch = createEventDispatcher();

  // Variables that reference the Svelte component and the DOM element
  // Variables with `_` reference points to the same variables from the `context="module"`
  let _dialogComp: SvelteComponent;
  let _dialogEl: HTMLDialogElement;
  // The single refernce to the `form` DOM element
  let formEl: HTMLFormElement;

  // Set base config to SDK
  // TODO: Move to a shared utility
  Config.set({
    // Set some basics by default
    ...{
      // TODO: Could this be a default OAuth client provided by Platform UI OOTB?
      clientId: 'WebLoginWidgetClient',
      // TODO: If a realmPath is not provided, should we call the realm endpoint and detect a likely default?
      // https://backstage.forgerock.com/docs/am/7/setup-guide/sec-rest-realm-rest.html#rest-api-list-realm
      realmPath: 'alpha',
      // TODO: Once we move to SSR, this default should be more intelligent
      redirectUri: browser ? window.location.href : 'https://localhost:3000/callback',
      scope: 'openid, email',
      tree: 'Login',
    },
    // Let user provided config override defaults
    ...config,
    // Force 'legacy' to remove confusion
    ...{ support: 'legacy' },
  });

  /**
   * Initialize the stores and ensure both variables point to the same reference.
   * Variables with _ are the reactive version of the original variable from above.
   */
  let _journeyStore = (journeyStore = initializeJourney(config));
  let _oauthStore = (oauthStore = initializeOauth(config));
  let _userStore = (userStore = initializeUser(config));

  initializeContent(content, true);
  // TODO: Runtime customization needs further development
  // initializeStyles(customStyles);

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
