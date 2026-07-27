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
import { initialize as initializeOauth } from '$core/oauth/oauth.store';
import {
  getData,
  pauseBehavioralData,
  resumeBehavioralData,
  start,
} from '$core/protect/protect.store';
import { initialize as initializeStyle } from '$core/style.store';
import { initialize as initializeUser } from '$core/user/user.store';
import { initialize as initializeJourneys } from '$journey/config.store';
import { getJourneyClient, initialize as initializeJourney } from '$journey/journey.store';

import type { GetTokensOptions } from '@forgerock/oidc-client/types';
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
    // initialize() creates a fresh, isolated store instance per call.
    // getOidcClient is injected into the user store so it shares the same
    // OIDC client instance without reaching into module-level state.
    oauthStore = initializeOauth(options?.oidcClient);
    userStore = initializeUser(oauthStore.getOidcClient);
    journeyStore = initializeJourney(options?.journeyClient, {
      ...(options?.captcha && { captcha: captchaConfigSchema.parse(options.captcha) }),
    });

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
        oauthStore = initializeOauth(setOptions?.oidcClient ?? options?.oidcClient);
        userStore = initializeUser(oauthStore.getOidcClient);
        journeyStore = initializeJourney(setOptions?.journeyClient ?? options?.journeyClient, {
          ...(setOptions?.captcha && { captcha: captchaConfigSchema.parse(setOptions.captcha) }),
        });

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
              oauthStore.getTokens();
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
     * User Info
     * @param: void
     * @returns: UserStore
     */
    info() {
      if (!journeyStore || !oauthStore || !userStore) {
        logErrorAndThrow('missingStores');
      }

      const { get, subscribe } = userStore;

      function wrappedGet() {
        get();
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
     * Logout a user: revoke tokens, end the OIDC session, and destroy the AM session.
     * @async
     * @param: void
     * @returns: Promise<void>
     **/
    async logout(): Promise<void> {
      if (!journeyStore || !oauthStore || !userStore) {
        logErrorAndThrow('missingStores');
      }

      /**
       *  1. journeyClient.terminate() — POST /sessions?_action=logout, destroys the AM SSO session
       *  2. oidcClient.user.logout() — end_session_endpoint (OIDC session) + revocation_endpoint
       *     (access token) + clears local token storage.
       */
      try {
        const journeyClient = await getJourneyClient();
        await journeyClient.terminate();
      } catch (err: unknown) {
        // Warn instead of throw; throwing to the caller would be misleading since there's nothing to recover from.
        console.warn('Session termination failed:', err instanceof Error ? err.message : err);
      }

      try {
        const oidcClient = await oauthStore.getOidcClient();
        await oidcClient.user.logout();
      } catch (err: unknown) {
        // Warn instead of throw; throwing to the caller would be misleading since there's nothing to recover from.
        console.warn('OIDC logout failed:', err instanceof Error ? err.message : err);
      }
      // Regardless of errors, reset all stores and restart journey
      resetAndRestartStores();
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

      const { getTokens, subscribe } = oauthStore;

      function wrappedGet(options?: GetTokensOptions) {
        getTokens(options);
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
    protect: {
      start,
      getData,
      pauseBehavioralData,
      resumeBehavioralData,
    },
    user,
  };
}
