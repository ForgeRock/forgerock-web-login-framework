<script context="module" lang="ts">
  import { Config, FRUser, type GetTokensOptions, SessionManager, TokenManager, UserManager } from '@forgerock/javascript-sdk';
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

  let callMounted: (form: HTMLFormElement) => void;
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
        } else if (requestsOauth && response.successful) {
          journey = response;
          oauthStore.get({ forceRenew: true });
        } else if (response.error) {
          journey = response;
          returnError({
            journey: response,
          });
        }
        // Clean up unneeded subscription
        if (response.completed) {
          journeyStoreUnsub();
        }
      });
      let oauthStoreUnsub = oauthStore.subscribe((response) => {
        if (!requestsUser && response.successful) {
          returnResponse({
            journey,
            oauth: response,
          });
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
        // Clean up unneeded subscription
        if (response.completed) {
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
        } else if (response.error) {
          returnError({
            journey,
            oauth,
            user: response,
          });
        }
        // Clean up unneeded subscription
        if (response.completed) {
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
  export const form = {
    onMount(fn: (form: HTMLFormElement) => void) {
      callMounted = (form: HTMLFormElement) => fn(form);
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
      return get(userStore).response
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
  import { createEventDispatcher, onMount as s_onMount } from 'svelte';

  import Journey from '$journey/journey.svelte';

  // Import the stores for initialization
  import { initialize as initializeJourney } from '$journey/journey.store';
  import { initialize as initializeContent } from '$lib/locale.store';
  import { initialize as initializeOauth } from '$lib/oauth/oauth.store';
  import { initialize as initializeUser } from '$lib/user/user.store';
  // import { initialize as initializeStyles } from './styles.store';

  export let config: any;
  export let content: any;
  // TODO: Runtime customization needs further development
  // export let customStyles: any;

  const dispatch = createEventDispatcher();

  // A refernce to the `form` DOM element
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
      redirectUri: (typeof window === 'object') ? window.location.href : 'https://localhost:3000/callback',
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

  initializeContent(content, true);
  // TODO: Runtime customization needs further development
  // initializeStyles(customStyles);

  s_onMount(() => {
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
</script>

<div class="fr_widget-root">
  <Journey
    bind:formEl
    journeyStore={_journeyStore}
  />
</div>
