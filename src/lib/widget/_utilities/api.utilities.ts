import {
  Config,
  FRUser,
  SessionManager,
  TokenManager,
  UserManager,
  type GetTokensOptions,
} from '@forgerock/javascript-sdk';
import HttpClient from '@forgerock/javascript-sdk/lib/http-client';
import { get } from 'svelte/store';
import type { z } from 'zod';

// Import the stores for initialization
import configure from '$lib/sdk.config';

import type { HttpClientRequestOptions } from '@forgerock/javascript-sdk/lib/http-client';

// Import store types
import type { JourneyOptions, Modal, Response } from '../interfaces';
import type { JourneyStore, JourneyStoreValue } from '$journey/journey.interfaces';
import type { OAuthStore, OAuthTokenStoreValue } from '$lib/oauth/oauth.store';
import type { partialConfigSchema } from '$lib/sdk.config';
import type { UserStore } from '$lib/user/user.store';

export function widgetApiFactory(modal?: Modal) {
  let journeyStore: JourneyStore;
  let oauthStore: OAuthStore;
  let userStore: UserStore;

  let returnError: (response: Response) => void;
  let returnResponse: (response: Response) => void;

  const configuration = {
    set(options: z.infer<typeof partialConfigSchema>): void {
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
        },
        // Let user provided config override defaults
        ...options,
        // Force 'legacy' to remove confusion
        ...{ support: 'legacy' },
      });
    },
  };
  const journey = {
    start(options?: JourneyOptions): void {
      const requestsOauth = options?.oauth || true;
      const requestsUser = options?.user || true;

      let journey: JourneyStoreValue;
      let oauth: OAuthTokenStoreValue;

      const journeyStoreUnsub = journeyStore.subscribe((response) => {
        if (!requestsOauth && response.successful) {
          returnResponse &&
            returnResponse({
              journey: response,
            });
          if (modal) {
            modal.close({ reason: 'auto' });
          }
        } else if (requestsOauth && response.successful) {
          journey = response;
          oauthStore?.get({ forceRenew: true });
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

      const oauthStoreUnsub = oauthStore.subscribe((response) => {
        if (!requestsUser && response.successful) {
          returnResponse &&
            returnResponse({
              journey,
              oauth: response,
            });
          if (modal) {
            modal.close({ reason: 'auto' });
          }
        } else if (requestsUser && response.successful) {
          oauth = response;
          userStore?.get();
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
      const userStoreUnsub = userStore.subscribe((response) => {
        if (response.successful) {
          returnResponse &&
            returnResponse({
              journey,
              oauth,
              user: response,
            });
          if (modal) {
            modal.close({ reason: 'auto' });
          }
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
  const user = {
    // TODO: add "scopes" to parameters for "true" authorization
    async authorized(remote = false) {
      if (remote) {
        try {
          return await UserManager.getCurrentUser();
        } catch (err) {
          console.warn(err);
          return;
        }
      }
      try {
        return !!(await TokenManager.getTokens());
      } catch (err) {
        return;
      }
    },
    async info(remote = false) {
      userStore = userStore as UserStore;
      if (remote) {
        try {
          return await UserManager.getCurrentUser();
        } catch (err) {
          console.warn(err);
          return;
        }
      }
      return get(userStore).response;
    },
    logout: async () => {
      const { clientId } = Config.get();

      userStore = userStore as UserStore;

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
      journeyStore && journeyStore.reset();
      oauthStore && oauthStore.reset();
      userStore && userStore.reset();

      // Fetch fresh journey step
      journey && journey.start();
    },
    async tokens(options?: GetTokensOptions) {
      // `getTokens` throws if no tokens, so catch and just return with `undefined`
      try {
        return await TokenManager.getTokens(options);
      } catch (err) {
        console.warn(err);
        return;
      }
    },
  };

  return {
    configuration,
    journey,
    async request(options: HttpClientRequestOptions) {
      return await HttpClient.request(options);
    },
    getJourneyStore() {
      return journeyStore;
    },
    getOAuthStore() {
      return oauthStore;
    },
    getUserStore() {
      return userStore;
    },
    ...(modal && { modal }),
    setJourneyStore(store: JourneyStore) {
      journeyStore = store;
    },
    setOAuthStore(store: OAuthStore) {
      oauthStore = store;
    },
    setUserStore(store: UserStore) {
      userStore = store;
    },
    user,
  };
}
