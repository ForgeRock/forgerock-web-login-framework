/**
 *
 * Copyright © 2025 - 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { writable } from 'svelte/store';

import type { UserInfoResponse } from '@forgerock/oidc-client/types';
import type { Writable } from 'svelte/store';

import type { Maybe } from '$core/interfaces';
import type { OidcClientReady } from '$core/oauth/oauth.store';

export interface UserStore extends Pick<Writable<UserStoreValue>, 'subscribe'> {
  get: () => void;
  reset: () => void;
}
export interface UserStoreValue {
  completed: boolean;
  error: Maybe<{
    code?: Maybe<number>;
    message: Maybe<string>;
    troubleshoot: Maybe<string>;
  }>;
  loading: boolean;
  successful: boolean;
  response: Maybe<UserInfoResponse>;
}

/**
 * @function initialize - Creates a fresh, isolated user store instance.
 *
 * `getOidcClient` is injected rather than imported from `oauth.store` so that
 * this module has no runtime dependency on module-level state in its sibling.
 * Each `initialize()` call creates its own writable — instances are isolated.
 *
 * @param {() => Promise<OidcClientReady>} getOidcClient - Injected from the
 *   `OAuthStore` returned by `oauth.store.initialize()`.
 */
export function initialize(getOidcClient: () => Promise<OidcClientReady>): UserStore {
  const userStore = writable<UserStoreValue>({
    completed: false,
    error: null,
    loading: false,
    successful: false,
    response: null,
  });

  async function get() {
    userStore.set({
      completed: false,
      error: null,
      loading: true,
      successful: false,
      response: null,
    });

    try {
      const oidcClient = await getOidcClient();
      const user = await oidcClient.user.info();

      if ('error' in user) {
        const message = typeof user.message === 'string' ? user.message : String(user.error);
        const code = typeof user.code === 'number' ? user.code : null;
        userStore.set({
          completed: true,
          error: { code, message, troubleshoot: null },
          loading: false,
          successful: false,
          response: null,
        });
        return;
      }

      userStore.set({
        completed: true,
        error: null,
        loading: false,
        successful: true,
        response: user,
      });
    } catch (err: unknown) {
      // Always an Error in practice; fallback covers unexpected third-party throws.
      const message = err instanceof Error ? err.message : 'Unknown user info error';
      userStore.set({
        completed: true,
        error: { message, troubleshoot: null },
        loading: false,
        successful: false,
        response: null,
      });
    }
  }

  function reset() {
    userStore.set({
      completed: false,
      error: null,
      loading: false,
      successful: false,
      response: null,
    });
  }

  return {
    get,
    reset,
    subscribe: userStore.subscribe,
  };
}
