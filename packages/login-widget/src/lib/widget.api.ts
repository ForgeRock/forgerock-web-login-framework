/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { derived, get } from 'svelte/store';

import { logErrorAndThrow } from '$core/_utilities/errors.utilities';
import { captchaConfigSchema } from '$core/captcha.config';
// Import the stores for initialization
import { componentStore } from '$core/component.store';
import { initialize as initializeLinks } from '$core/links.store';
import { initialize as initializeContent } from '$core/locale.store';
import { createOidcClientStore, initialize as initializeOauth } from '$core/oauth/oauth.store';
import { protectStore } from '$core/protect/protect.store';
import { initialize as initializeStyle } from '$core/style.store';
import { initialize as initializeUser } from '$core/user/user.store';
import { initialize as initializeJourneys } from '$journey/config.store';
import { getJourneyClient, initialize as initializeJourney } from '$journey/journey.store';

import type { OidcClient } from '@forgerock/oidc-client/types';
import type { Readable } from 'svelte/store';

import type { componentApi as _componentApi } from './_utilities/component.utilities';
import type {
  JourneyOptions,
  JourneyOptionsChange,
  JourneyOptionsStart,
  WidgetConfigOptions,
} from './interfaces';
import type { OAuthStore, OAuthTokenStoreValue } from '$core/oauth/oauth.store';
import type { UserStore, UserStoreValue } from '$core/user/user.store';
import type { JourneyStore, JourneyStoreValue } from '$journey/journey.interfaces';

/**
 * @function widgetApiFactory - Creates the widget API
 * @param {object} componentApi - The component API
 * @returns {object} - The widget API
 * @property {object} componentApi - The component API for either inline or modal
 * @property {object} configuration - Sets the configuration for the widget
 * @property {function} getStores - Returns the stores: journeyStore, oauthStore, userStore
 * @property {object} journey - the journey API
 * @property {object} protect - the PingOne Protect API
 * @property {object} user - the user API
 */
export function widgetApiFactory(componentApi: ReturnType<typeof _componentApi>) {
  let journeyStore: JourneyStore;
  let oauthStore: OAuthStore;
  let userStore: UserStore;
  let oidcClientStore: Readable<OidcClient | null>;

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
    if (options?.oidcClient) {
      oidcClientStore = createOidcClientStore(options.oidcClient);
    }

    journeyStore = initializeJourney(options?.journeyClient, {
      ...(options?.captcha && { captcha: captchaConfigSchema.parse(options.captcha) }),
    });
    oauthStore = initializeOauth(oidcClientStore);
    userStore = initializeUser(oidcClientStore);

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
        const oidcConfig = setOptions?.oidcClient ?? options?.oidcClient;

        if (oidcConfig) {
          oidcClientStore = createOidcClientStore(oidcConfig);
        }

        journeyStore = initializeJourney(setOptions?.journeyClient, {
          ...(setOptions?.captcha && { captcha: captchaConfigSchema.parse(setOptions.captcha) }),
        });
        oauthStore = initializeOauth(oidcClientStore);
        userStore = initializeUser(oidcClientStore);

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

    const requestsOauth = options?.oauth ?? true;
    const requestsUser = options?.user ?? true;
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
        journeyStore.start(
          startOptions?.journey
            ? {
                journey: startOptions.journey,
                ...(startOptions.query && { query: startOptions.query }),
              }
            : undefined,
          startOptions?.recaptchaAction,
        );
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
     * User Info — reactive derived store. Automatically fetches user info
     * when the OIDC client is ready. Subscribe to receive state updates.
     * @returns {{ subscribe: Readable<UserStoreValue>['subscribe'] }}
     */
    info() {
      if (!journeyStore || !oauthStore || !userStore) {
        logErrorAndThrow('missingStores');
      }

      if (!oidcClientStore) {
        return { subscribe: userStore.subscribe };
      }

      const { subscribe } = derived(
        [oidcClientStore, userStore],
        ([$oidcClientStore, $userStore], set) => {
          set($userStore);

          if ($oidcClientStore && !$userStore.loading && !$userStore.completed) {
            userStore.get();
          }
        },
      );

      return { subscribe };
    },
    /**
     * Logout a user from an AM Session
     * @async
     * @param: void
     * @returns: Promise<void>
     * @throws {Error} If called before configuration(), or if server-side session/token termination fails
     **/
    async logout() {
      if (!journeyStore || !oauthStore || !userStore) {
        logErrorAndThrow('missingStores');
      }

      /**
       * 1. journeyClient.terminate() — POST /sessions?_action=logout, destroys the AM SSO session
       * 2. oidcClient.user.logout() — end_session_endpoint (OIDC session) + revocation_endpoint
       * (access token) + clears local token storage.
       */
      try {
        const journeyClient = await getJourneyClient();
        await journeyClient.terminate();

        const oidcClientValue = oidcClientStore ? get(oidcClientStore) : null;
        if (oidcClientValue && !('error' in oidcClientValue)) {
          await oidcClientValue.user.logout();
        }

        resetAndRestartStores();
      } catch (err) {
        // Regardless of errors, reset all stores and restart journey
        resetAndRestartStores();
        throw err;
      }
    },
    /**
     * Tokens — reactive derived store. Automatically fetches tokens when the
     * OIDC client is ready. Subscribe to receive state updates.
     * @returns {{ subscribe: Readable<OAuthTokenStoreValue>['subscribe'] }}
     */
    tokens() {
      if (!journeyStore || !oauthStore || !userStore) {
        logErrorAndThrow('missingStores');
      }

      if (!oidcClientStore) {
        return { subscribe: oauthStore.subscribe };
      }

      const { subscribe } = derived(
        [oidcClientStore, oauthStore],
        ([$oidcClientStore, $oauthStore], set) => {
          set($oauthStore);

          if ($oidcClientStore && !$oauthStore.loading && !$oauthStore.completed) {
            oauthStore.get();
          }
        },
      );

      return { subscribe };
    },
  };

  return {
    component: componentApi,
    configuration,
    getStores,
    journey,
    protect: {
      start: protectStore.start,
      getData: protectStore.getData,
      pauseBehavioralData: protectStore.pauseBehavioralData,
      resumeBehavioralData: protectStore.resumeBehavioralData,
    },
    user,
  };
}
