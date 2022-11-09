<script context="module" lang="ts">
  import {
    Config,
    FRUser,
    type GetTokensOptions,
    SessionManager,
    TokenManager,
    UserManager,
    HttpClient,
  } from '@forgerock/javascript-sdk';
  import type { HttpClientRequestOptions } from '@forgerock/javascript-sdk/lib/http-client';
  import { get } from 'svelte/store';

  // Import store types
  import type { JourneyOptions, Response } from './interfaces';
  import type { JourneyStore, JourneyStoreValue } from '$journey/journey.interfaces';
  import type { OAuthStore, OAuthTokenStoreValue } from '$lib/oauth/oauth.store';
  import type { UserStore } from '$lib/user/user.store';

  import './main.css';

  let dialogComp: SvelteComponent;
  let dialogEl: HTMLDialogElement;
  let callMounted: (dialog: HTMLDialogElement, form: HTMLFormElement) => void;
  let closeCallback: (arg: { reason: 'auto' | 'external' | 'user' }) => void;
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
          returnResponse &&
            returnResponse({
              journey: response,
            });
          modal.close({ reason: 'auto' });
        } else if (requestsOauth && response.successful) {
          journey = response;
          oauthStore.get({ forceRenew: true });
        } else if (response.error) {
          journey = response;
          returnError &&
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
          returnResponse &&
            returnResponse({
              journey,
              oauth: response,
            });
          modal.close({ reason: 'auto' });
        } else if (requestsUser && response.successful) {
          oauth = response;
          userStore.get();
        } else if (response.error) {
          oauth = response;
          returnError &&
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
          returnResponse &&
            returnResponse({
              journey,
              oauth,
              user: response,
            });
          modal.close({ reason: 'auto' });
        } else if (response.error) {
          returnError &&
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

      if (options?.resumeUrl) {
        journeyStore.resume(options.resumeUrl);
      } else {
        journeyStore.start({
          ...options?.config,
          tree: options?.journey,
        });
      }
    },
    onFailure(fn: (response: Response) => void) {
      returnError = (response) => fn(response);
    },
    onSuccess(fn: (response: Response) => void) {
      returnResponse = (response) => fn(response);
    },
  };
  export const modal = {
    close(args?: { reason: 'auto' | 'external' | 'user' }) {
      dialogComp.closeDialog(args);
    },
    onClose(fn: (args: { reason: 'auto' | 'external' | 'user' }) => void) {
      closeCallback = (args) => fn(args);
    },
    onMount(fn: (dialog: HTMLDialogElement, form: HTMLFormElement) => void) {
      callMounted = (dialog, form) => fn(dialog, form);
    },
    open(options?: JourneyOptions): void {
      // If journey does not have a step, start the journey
      if (!get(journeyStore).step) {
        journey.start(options);
      }
      dialogEl.showModal();
    },
  };
  export const request = async (options: HttpClientRequestOptions) => {
    return await HttpClient.request(options);
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
  import { createEventDispatcher, onMount as s_onMount, SvelteComponent } from 'svelte';
  import type { z } from 'zod';

  import Dialog from '$components/compositions/dialog/dialog.svelte';
  import Journey from '$journey/journey.svelte';
  import type { partialStringsSchema } from '$lib/locale.store';

  // Import the stores for initialization
  import configure, { type partialConfigSchema } from '$lib/config';
  import { initialize as initializeJourney } from '$journey/journey.store';
  import { initialize as initializeContent } from '$lib/locale.store';
  import { initialize as initializeLinks, partialLinksSchema } from '$lib/links.store';
  import { initialize as initializeOauth } from '$lib/oauth/oauth.store';
  import { initialize as initializeUser } from '$lib/user/user.store';
  import { initialize as initializeStyle, type Style } from '$lib/style.store';

  export let config: z.infer<typeof partialConfigSchema>;
  export let content: z.infer<typeof partialStringsSchema>;
  export let links: z.infer<typeof partialLinksSchema>;
  export let style: Style;

  const dispatch = createEventDispatcher();

  // Refernce to the closeCallback from the above module context
  let _closeCallback = closeCallback;

  // Variables that reference the Svelte component and the DOM element
  // Variables with `_` reference points to the same variables from the `context="module"`
  let _dialogComp: SvelteComponent;
  let _dialogEl: HTMLDialogElement;
  // The single refernce to the `form` DOM element
  let formEl: HTMLFormElement;

  // Set base config to SDK
  // TODO: Move to a shared utility
  configure({
    // Set some basics by default
    ...{
      // TODO: Could this be a default OAuth client provided by Platform UI OOTB?
      clientId: 'WebLoginWidgetClient',
      // TODO: If a realmPath is not provided, should we call the realm endpoint and detect a likely default?
      // https://backstage.forgerock.com/docs/am/7/setup-guide/sec-rest-realm-rest.html#rest-api-list-realm
      realmPath: 'alpha',
      // TODO: Once we move to SSR, this default should be more intelligent
      redirectUri:
        typeof window === 'object' ? window.location.href : 'https://localhost:3000/callback',
      scope: 'openid email',
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

  initializeContent(content);
  initializeLinks(links);
  initializeStyle(style);

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
  <Dialog
    bind:dialogEl={_dialogEl}
    bind:this={_dialogComp}
    closeCallback={_closeCallback}
    dialogId="sampleDialog"
  >
    <!--
      `displayIcon` prioritizes the direct configuration with `style.stages.icon`,
      but falls back to the existence of the logo with `style.logo`
    -->
    <Journey
      bind:formEl
      displayIcon={style?.stage?.icon ?? !style?.logo}
      journeyStore={_journeyStore}
    />
  </Dialog>
</div>
