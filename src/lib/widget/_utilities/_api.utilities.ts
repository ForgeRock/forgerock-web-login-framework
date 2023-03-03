import { Config, FRUser, SessionManager, type ConfigOptions } from '@forgerock/javascript-sdk';
import HttpClient from '@forgerock/javascript-sdk/lib/http-client';
import { derived, type Readable } from 'svelte/store';

// Import the stores for initialization
import configure from '$lib/sdk.config';

import { initialize as initializeJourneys } from '$journey/config.store';
import { initialize as initializeJourney } from '$journey/journey.store';
import { initialize as initializeContent } from '$lib/locale.store';
import { initialize as initializeLinks } from '$lib/links.store';
import { initialize as initializeOauth, type OAuthTokenStoreValue } from '$lib/oauth/oauth.store';
import { initialize as initializeUser, type UserStoreValue } from '$lib/user/user.store';
import { initialize as initializeStyle } from '$lib/style.store';

import type {
  ComponentApi,
  JourneyOptions,
  JourneyOptionsStart,
  WidgetConfigOptions,
} from '../interfaces';
import type { JourneyStore, JourneyStoreValue } from '$journey/journey.interfaces';
import type { OAuthStore } from '$lib/oauth/oauth.store';
import type { UserStore } from '$lib/user/user.store';

export function widgetApiFactory(modal?: ComponentApi) {
  let journeyStore: JourneyStore;
  let oauthStore: OAuthStore;
  let userStore: UserStore;

  function resetAndRestartStores() {
    // Reset stores
    journeyStore && journeyStore.reset();
    oauthStore && oauthStore.reset();
    userStore && userStore.reset();

    // Fetch fresh journey step
    journey && journey().start();
  }

  const configuration = () => {
    return {
      set(options: WidgetConfigOptions): void {
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
          ...options.config,
          // Force 'legacy' to remove confusion
          ...{ support: 'legacy' },
        });

        /**
         * Initialize the stores and ensure both variables point to the same reference.
         * Variables with _ are the reactive version of the original variable from above.
         */
        journeyStore = initializeJourney(options.config);
        oauthStore = initializeOauth(options.config);
        userStore = initializeUser(options.config);

        initializeContent(options.content);
        initializeJourneys(options.journeys);
        initializeLinks(options.links);
        initializeStyle(options.style);
      },
    };
  };
  const journey = (options?: JourneyOptions) => {
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

          if ($journeyStore.successful && $oauthStore.successful && $userStore.completed) {
            modal && modal.close({ reason: 'auto' });
          } else if ($journeyStore.successful && $oauthStore.successful) {
            if (requestsUser && $userStore.loading === false && $userStore.completed === false) {
              userStore.get();
            } else if (!requestsUser) {
              modal && modal.close({ reason: 'auto' });
            }
          } else if ($journeyStore.successful) {
            if (requestsOauth && $oauthStore.loading === false && $oauthStore.completed === false) {
              oauthStore.get();
            } else if (!requestsOauth) {
              modal && modal.close({ reason: 'auto' });
            }
          }
        },
      );

    function start(startOptions?: JourneyOptionsStart) {
      if (startOptions?.resumeUrl) {
        journeyStore.resume(startOptions.resumeUrl);
      } else {
        journeyStore.start({
          ...startOptions?.config,
          tree: startOptions?.journey,
        });
      }
      return new Promise((resolve) => {
        const unsubscribe = subscribe((event) => {
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

    return { start, subscribe };
  };
  const user = {
    info() {
      const { get, subscribe } = userStore;

      function wrappedGet(options?: ConfigOptions) {
        get(options);
        return new Promise((resolve) => {
          const unsubscribe = userStore.subscribe((event) => {
            if (event.completed) {
              resolve(event);
              unsubscribe();
            }
          });
        });
      }

      return { get: wrappedGet, subscribe };
    },
    async logout() {
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
    tokens() {
      const { get, subscribe } = oauthStore;

      function wrappedGet(options?: ConfigOptions) {
        get(options);
        return new Promise((resolve) => {
          const unsubscribe = oauthStore.subscribe((event) => {
            if (event.completed) {
              resolve(event);
              unsubscribe();
            }
          });
        });
      }

      return { get: wrappedGet, subscribe };
    },
  };

  return {
    configuration,
    journey,
    request: HttpClient.request,
    ...(modal && { modal }),
    getStores() {
      return {
        journeyStore,
        oauthStore,
        userStore,
      };
    },
    user,
  };
}
