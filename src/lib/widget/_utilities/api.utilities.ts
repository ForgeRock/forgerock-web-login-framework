import { Config, FRUser, SessionManager, type ConfigOptions } from '@forgerock/javascript-sdk';
import { HttpClient } from '@forgerock/javascript-sdk';
import { derived, get, type Readable } from 'svelte/store';

import { logErrorAndThrow } from '$lib/_utilities/errors.utilities';
import configure from '$lib/sdk.config';

// Import the stores for initialization
import { componentStore } from './component.utilities';
import { initialize as initializeJourneys } from '$journey/config.store';
import { initialize as initializeJourney } from '$journey/journey.store';
import { initialize as initializeContent } from '$lib/locale.store';
import { initialize as initializeLinks } from '$lib/links.store';
import { initialize as initializeOauth } from '$lib/oauth/oauth.store';
import { initialize as initializeUser } from '$lib/user/user.store';
import { initialize as initializeStyle } from '$lib/style.store';

import type { componentApi as _componentApi } from './component.utilities';
import type {
  JourneyOptions,
  JourneyOptionsChange,
  JourneyOptionsStart,
  WidgetConfigOptions,
} from '../interfaces';
import type { JourneyStore, JourneyStoreValue } from '$journey/journey.interfaces';
import type { OAuthStore, OAuthTokenStoreValue } from '$lib/oauth/oauth.store';
import type { UserStore, UserStoreValue } from '$lib/user/user.store';

/**
 * @function widgetApiFactory - Creates the widget API
 * @param {object} componentApi - The component API
 * @returns {object} - The widget API
 * @property {object} componentApi - The component API for either inline or modal
 * @property {object} configuration - Sets the configuration for the widget
 * @property {function} getStores - Returns the stores: journeyStore, oauthStore, userStore
 * @property {object} journey - the journey API
 * @property {function} request - The HttpClient.request function from the SDK
 * @property {object} user - the user API
 */
export function widgetApiFactory(componentApi: ReturnType<typeof _componentApi>) {
  let journeyStore: JourneyStore;
  let oauthStore: OAuthStore;
  let userStore: UserStore;

  function getStores() {
    return {
      journeyStore,
      oauthStore,
      userStore,
    };
  }
  function resetAndRestartStores() {
    // Reset stores
    journeyStore.reset();
    oauthStore.reset();
    userStore.reset();
  }

  const configuration = (options?: WidgetConfigOptions) => {
    if (options?.forgerock) {
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
        },
        // Let user provided config override defaults
        ...options?.forgerock,
        // Force 'legacy' to remove confusion
        ...{ support: 'legacy' },
      });
    }

    /**
     * Initialize all the stores.
     */
    journeyStore = initializeJourney(options?.forgerock);
    oauthStore = initializeOauth(options?.forgerock);
    userStore = initializeUser(options?.forgerock);

    initializeContent(options?.content);
    initializeJourneys(options?.journeys);
    initializeLinks(options?.links);
    initializeStyle(options?.style);

    return {
      /** Set the Login Widget's Configuration
       * @param {WidgetConfigOptions} options - The configuration options for the Login Widget
       * @returns {void}
       **/
      set(setOptions?: WidgetConfigOptions): void {
        if (setOptions?.forgerock) {
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
                typeof window === 'object'
                  ? window.location.href
                  : 'https://localhost:3000/callback',
              scope: 'openid email',
            },
            // Let user provided config override defaults
            ...setOptions?.forgerock,
            // Force 'legacy' to remove confusion
            ...{ support: 'legacy' },
          });
        }

        /**
         * Initialize the stores and ensure both variables point to the same reference.
         * Variables with _ are the reactive version of the original variable from above.
         */
        journeyStore = initializeJourney(setOptions?.forgerock);
        oauthStore = initializeOauth(setOptions?.forgerock);
        userStore = initializeUser(setOptions?.forgerock);

        initializeContent(setOptions?.content);
        initializeJourneys(setOptions?.journeys);
        initializeLinks(setOptions?.links);
        initializeStyle(setOptions?.style);
      },
    };
  };
  const journey = (options?: JourneyOptions) => {
    if (!journeyStore || !oauthStore || !userStore) {
      logErrorAndThrow('missingStores');
    }

    const requestsOauth = options?.oauth || true;
    const requestsUser = options?.user || true;
    const {
      subscribe,
    }: Readable<{ journey: JourneyStoreValue; oauth: OAuthTokenStoreValue; user: UserStoreValue }> =
      derived(
        [journeyStore, oauthStore, userStore],
        ([$journeyStore, $oauthStore, $userStore], set) => {
          set({
            journey: $journeyStore,
            oauth: $oauthStore,
            user: $userStore,
          });

          if ($oauthStore.error || $userStore.error) {
            // If we get any errors from the stores, close the modal
            formFactor === 'modal' && componentApi.close({ reason: 'auto' });
          }

          if ($journeyStore.successful && $oauthStore.successful && $userStore.completed) {
            formFactor === 'modal' && componentApi.close({ reason: 'auto' });
          } else if ($journeyStore.successful && $oauthStore.successful) {
            if (requestsUser && $userStore.loading === false && $userStore.completed === false) {
              userStore.get();
            } else if (!requestsUser) {
              formFactor === 'modal' && componentApi.close({ reason: 'auto' });
            }
          } else if ($journeyStore.successful) {
            if (requestsOauth && $oauthStore.loading === false && $oauthStore.completed === false) {
              oauthStore.get();
            } else if (!requestsOauth) {
              formFactor === 'modal' && componentApi.close({ reason: 'auto' });
            }
          }
        },
      );
    // Create a simple reference to prevent repeated subscribing and unsubscribing
    let formFactor: 'modal' | 'inline' | null = null;

    function change(changeOptions: JourneyOptionsChange) {
      return start(changeOptions);
    }

    function start(startOptions?: JourneyOptionsStart) {
      // If starting a journey, let's reset the stores in case they had previous state
      oauthStore.reset();
      userStore.reset();

      // Grab the form factor and cache it
      formFactor = get(componentStore).type;

      if (startOptions?.resumeUrl) {
        journeyStore.resume(startOptions.resumeUrl);
      } else {
        journeyStore.start({
          ...startOptions?.forgerock,
          // Only include a `tree` property if the `journey` options prop is truthy
          ...(startOptions?.journey && { tree: startOptions?.journey }),
        });
      }
      return new Promise((resolve, reject) => {
        const unsubscribe = subscribe((event) => {
          if (event.oauth.error || event.user.error) {
            reject(event);
            unsubscribe();
          }
          if (event.journey.successful && event.oauth.successful && event.user.completed) {
            resolve(event);
            unsubscribe();
          } else if (event.journey.successful && event.oauth.successful) {
            if (!requestsUser) {
              resolve(event);
              unsubscribe();
            }
          } else if (event.journey.successful) {
            if (!requestsOauth) {
              resolve(event);
              unsubscribe();
            }
          }
        });
      });
    }

    return { change, start, subscribe };
  };
  const user = {
    /**
     * User Info
     * @param: void
     * @returns: UserStore
     */
    info() {
      if (!journeyStore || !oauthStore || !userStore) {
        logErrorAndThrow('missingStores');
      }

      const { get, subscribe } = userStore;

      function wrappedGet(options?: ConfigOptions) {
        get(options);
        return new Promise((resolve, reject) => {
          const unsubscribe = userStore.subscribe((event) => {
            if (event.successful) {
              resolve(event);
              unsubscribe();
            } else if (event.error) {
              reject(event);
              unsubscribe();
            }
          });
        });
      }

      return { get: wrappedGet, subscribe };
    },
    /**
     * Logout a user from an AM Session
     * @async
     * @param: void
     * @returns: Promise<void>
     **/
    async logout() {
      if (!journeyStore || !oauthStore || !userStore) {
        logErrorAndThrow('missingStores');
      }

      const { clientId } = Config.get();

      let obj;

      /**
       * If configuration has a clientId, then use FRUser to logout to ensure
       * token revoking and removal; else, just end the session.
       */
      if (clientId) {
        obj = FRUser;
      } else {
        obj = SessionManager;
      }

      try {
        await obj.logout();
        resetAndRestartStores();
      } catch (err) {
        // Regardless of errors, reset all stores and restart journey
        resetAndRestartStores();
        throw err;
      }
      // Return undefined as there's no response information to share
      return;
    },
    /**
     * Returns the widget's Tokens object
     * @param void;
     * @returns OAuthStore
     */
    tokens() {
      if (!journeyStore || !oauthStore || !userStore) {
        logErrorAndThrow('missingStores');
      }

      const { get, subscribe } = oauthStore;

      function wrappedGet(options?: ConfigOptions) {
        get(options);
        return new Promise((resolve, reject) => {
          const unsubscribe = oauthStore.subscribe((event) => {
            if (event.successful) {
              resolve(event);
              unsubscribe();
            } else if (event.error) {
              reject(event);
              unsubscribe();
            }
          });
        });
      }

      return { get: wrappedGet, subscribe };
    },
  };

  return {
    component: componentApi,
    configuration,
    getStores,
    journey,
    request: HttpClient.request.bind(HttpClient),
    user,
  };
}
