import { UserManager, type ConfigOptions } from '@forgerock/javascript-sdk';
import { writable, type Writable } from 'svelte/store';

import type { Maybe } from '$lib/interfaces';

export interface UserStore extends Pick<Writable<UserStoreValue>, 'subscribe'> {
  get: (getOptions?: ConfigOptions) => void;
  reset: () => void;
}
export interface UserStoreValue {
  completed: boolean;
  error: Maybe<{
    code?: Maybe<number>;
    message: Maybe<string>;
  }>;
  loading: boolean;
  successful: boolean;
  response: unknown;
}

export function initialize(initOptions?: ConfigOptions) {
  const { set, subscribe }: Writable<UserStoreValue> = writable({
    completed: false,
    error: null,
    loading: false,
    successful: false,
    response: null,
  });

  async function get(getOptions?: ConfigOptions) {
    /**
     * Create an options object with getOptions overriding anything from initOptions
     * TODO: Does this object merge need to be more granular?
     */
    const options = {
      ...initOptions,
      ...getOptions,
    };

    set({
      completed: false,
      error: null,
      loading: true,
      successful: false,
      response: null,
    });

    try {
      const user = await UserManager.getCurrentUser(options);

      set({
        completed: true,
        error: null,
        loading: false,
        successful: true,
        response: user,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        set({
          completed: true,
          error: {
            message: err.message,
          },
          loading: false,
          successful: false,
          response: null,
        });
      }
    }
  }

  function reset() {
    set({
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
    subscribe,
  };
}
