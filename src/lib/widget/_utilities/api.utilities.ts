import { Config, FRUser, SessionManager, type GetTokensOptions } from '@forgerock/javascript-sdk';
import HttpClient from '@forgerock/javascript-sdk/lib/http-client';
import { derived } from 'svelte/store';
import type { z } from 'zod';

import type { HttpClientRequestOptions } from '@forgerock/javascript-sdk/lib/http-client';

// Import the stores for initialization
import configure from '$lib/sdk.config';

import type { JourneyOptions, Modal } from '../interfaces';
import type { JourneyStore } from '$journey/journey.interfaces';
import type { OAuthStore } from '$lib/oauth/oauth.store';
import type { partialConfigSchema } from '$lib/sdk.config';
import type { UserStore } from '$lib/user/user.store';

export function widgetApiFactory(modal?: Modal) {
  let journeyStore: JourneyStore;
  let oauthStore: OAuthStore;
  let userStore: UserStore;

  const configuration = {
    set(options: z.infer<typeof partialConfigSchema>): void {
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
    start(options?: JourneyOptions) {
      const requestsOauth = options?.oauth || true;
      const requestsUser = options?.user || true;
      const { subscribe } = derived(
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

      if (options?.resumeUrl) {
        journeyStore.resume(options.resumeUrl);
      } else {
        journeyStore.start({
          ...options?.config,
          tree: options?.journey,
        });
      }
      return subscribe;
    },
  };
  const user = {
    // TODO: Add `scopes` parameter to add more granular authorization check
    authorized(remote = false) {
      const { subscribe } = derived([oauthStore, userStore], ([$oauthStore, $userStore], set) => {
        let userAuthorized;
        let store;

        if (remote) {
          store = $userStore;
          userAuthorized = !!store.response;
        } else {
          store = $oauthStore;
          userAuthorized = !!store.response?.accessToken;
        }
        set({
          completed: store.completed,
          error: store.error,
          loading: store.loading,
          authorized: userAuthorized,
        });
      });
      if (remote) {
        userStore.get();
      }
      return subscribe;
    },
    info(remote = false) {
      const { subscribe } = derived(userStore, ($userStore, set) => {
        if (remote) {
          const { completed, error, loading, response } = $userStore;
          set({
            completed,
            error,
            loading,
            response,
          });
        }
      });
      if (remote) {
        userStore.get();
      }
      return subscribe;
    },
    async logout() {
      let obj;

      const { clientId } = Config.get();

      function resetAndRestart() {
        // Reset stores
        journeyStore && journeyStore.reset();
        oauthStore && oauthStore.reset();
        userStore && userStore.reset();

        // Fetch fresh journey step
        journey && journey.start();
      }

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
        resetAndRestart();
      } catch (err) {
        resetAndRestart();
        throw err;
      }
    },
    tokens(options?: GetTokensOptions) {
      const { subscribe } = derived(oauthStore, ($oauthStore, set) => {
        set({
          ...$oauthStore,
        });
      });
      oauthStore.get(options);
      return subscribe;
    },
  };

  return {
    configuration,
    journey,
    async request(options: HttpClientRequestOptions) {
      return await HttpClient.request(options);
    },
    ...(modal && { modal }),
    setStores(journeyStoreRef: JourneyStore, oauthStoreRef: OAuthStore, userStoreRef: UserStore) {
      journeyStore = journeyStoreRef;
      oauthStore = oauthStoreRef;
      userStore = userStoreRef;
    },
    user,
  };
}
