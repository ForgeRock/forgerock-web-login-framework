import type { z } from 'zod';

// Import the stores for initialization
import configure from '$lib/sdk.config';

// Import store types
import type { JourneyOptions, Modal, Response, WidgetApiParams } from '../interfaces';
import type { JourneyStore, JourneyStoreValue } from '$journey/journey.interfaces';
import type { OAuthStore, OAuthTokenStoreValue } from '$lib/oauth/oauth.store';
import type { partialConfigSchema } from '$lib/sdk.config';
import type { UserStore } from '$lib/user/user.store';
import type { HttpClientRequestOptions } from '@forgerock/javascript-sdk/lib/http-client';
import HttpClient from '@forgerock/javascript-sdk/lib/http-client';
import {
  Config,
  FRUser,
  SessionManager,
  TokenManager,
  UserManager,
  type GetTokensOptions,
} from '@forgerock/javascript-sdk';
import { get } from 'svelte/store';

export function widgetApiFactory(widgetApiParams: WidgetApiParams) {
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

      const journeyStore = widgetApiParams.journeyStore as JourneyStore;
      const modal = widgetApiParams.modal as Modal;
      const oauthStore = widgetApiParams.oauthStore as OAuthStore;
      const returnError = widgetApiParams.returnError as (response: Response) => void;
      const returnResponse = widgetApiParams.returnResponse as (response: Response) => void;
      const userStore = widgetApiParams.userStore as UserStore;

      let journey: JourneyStoreValue;
      let oauth: OAuthTokenStoreValue;

      const journeyStoreUnsub = journeyStore.subscribe((response) => {
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

      const oauthStoreUnsub = oauthStore.subscribe((response) => {
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
      const userStoreUnsub = userStore.subscribe((response) => {
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
      widgetApiParams.returnError = (response) => fn(response);
    },
    onSuccess(fn: (response: Response) => void) {
      widgetApiParams.returnResponse = (response) => fn(response);
    },
  };
  const user = {
    async authorized(remote = false) {
      if (remote) {
        return !!(await UserManager.getCurrentUser());
      }
      return !!(await TokenManager.getTokens());
    },
    async info(remote = false) {
      widgetApiParams.userStore = widgetApiParams.userStore as UserStore;
      if (remote) {
        return await UserManager.getCurrentUser();
      }
      return get(widgetApiParams.userStore).response;
    },
    logout: async () => {
      const { clientId } = Config.get();

      widgetApiParams.journeyStore = widgetApiParams.journeyStore as JourneyStore;
      widgetApiParams.oauthStore = widgetApiParams.oauthStore as OAuthStore;
      widgetApiParams.userStore = widgetApiParams.userStore as UserStore;

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
      widgetApiParams.journeyStore.reset();
      widgetApiParams.oauthStore.reset();
      widgetApiParams.userStore.reset();

      // Fetch fresh journey step
      journey.start();
    },
    async tokens(options?: GetTokensOptions) {
      return await TokenManager.getTokens(options);
    },
  };

  return {
    configuration,
    journey,
    async request(options: HttpClientRequestOptions) {
      return await HttpClient.request(options);
    },
    user,
  };
}
