/**
 *
 * Copyright © 2025 - 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { get as getStoreValue, writable } from 'svelte/store';

import type { UserInfoResponse } from '@forgerock/oidc-client/types';
import type { OidcClient } from '@forgerock/oidc-client/types';
import type { Readable, Writable } from 'svelte/store';

import type { Maybe } from '$core/interfaces';

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

const INITIAL_STATE: UserStoreValue = {
  completed: false,
  error: null,
  loading: false,
  successful: false,
  response: null,
};

/**
 * @function initialize - Initializes the user store with a get function and a reset function
 * @param {Readable<OidcClient | null>} oidcClientStore - The OIDC client store to use for user info retrieval
 * @returns {UserStore} - The user store
 */
export function initialize(oidcClientStore: Readable<OidcClient | null> | undefined): UserStore {
  const userStore = writable<UserStoreValue>(INITIAL_STATE);

  async function get() {
    if (!oidcClientStore) {
      userStore.set({
        completed: true,
        error: { message: 'OIDC client not configured', troubleshoot: null },
        loading: false,
        successful: false,
        response: null,
      });
      return;
    }

    const oidcClient = getStoreValue(oidcClientStore);

    if (!oidcClient) {
      userStore.set({
        completed: true,
        error: { message: 'OIDC client not ready', troubleshoot: null },
        loading: false,
        successful: false,
        response: null,
      });
      return;
    }

    if ('error' in oidcClient) {
      userStore.set({
        completed: true,
        error: { message: String(oidcClient.error), troubleshoot: null },
        loading: false,
        successful: false,
        response: null,
      });
      return;
    }

    userStore.set({ ...INITIAL_STATE, loading: true });

    try {
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
    userStore.set(INITIAL_STATE);
  }

  return {
    get,
    reset,
    subscribe: userStore.subscribe,
  };
}
