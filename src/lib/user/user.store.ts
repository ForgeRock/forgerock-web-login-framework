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
  error: string;
  loading: boolean;
  successful: boolean;
  info: unknown;
}

export function initialize(initOptions?: ConfigOptions) {
  const { set, subscribe }: Writable<UserStoreValue> = writable({
    completed: false,
    error: '',
    loading: false,
    successful: false,
    info: null,
  });

  async function get(getOptions?: ConfigOptions) {
    /**
     * Create an options object with getOptions overriding anything from initOptions
     */
    const options = {
      ...initOptions,
      ...getOptions,
    };

    try {
      const user = await UserManager.getCurrentUser(options);

      set({
        completed: true,
        error: '',
        loading: false,
        successful: true,
        info: user,
      });
    } catch (err: unknown) {
      console.error(`Get current user | ${err}`);
      if (err instanceof Error) {
        set({
          completed: true,
          error: '',
          loading: false,
          successful: false,
          info: null,
        });
      }
    }
  }

  function reset() {
    set({
      completed: false,
      error: '',
      loading: false,
      successful: false,
      info: null,
    });
  }

  return {
    get,
    reset,
    subscribe,
  }
}
