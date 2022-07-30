import {
  UserManager, type ConfigOptions,
} from '@forgerock/javascript-sdk';
import { writable, type Writable } from 'svelte/store';

export interface UserStore extends Pick<Writable<UserStoreValue>, 'subscribe'> {
  get: (getOptions?: ConfigOptions) => void;
  reset: () => void;
}
export interface UserStoreValue {
  completed: boolean;
  error: {
    code?: number | null;
    message: string | null;
  } | null;
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
      console.error(`Get current user | ${err}`);
      if (err instanceof Error) {
        set({
          completed: true,
          error: {
            message: err.message
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
  }
}
