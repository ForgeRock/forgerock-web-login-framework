import {
  TokenManager,
  type GetTokensOptions,
  type OAuth2Tokens,
} from '@forgerock/javascript-sdk';
import { writable, type Writable } from 'svelte/store';

export interface OAuthStore extends Pick<Writable<OAuthTokenStoreValue>, 'subscribe'> {
  get: (getOptions?: GetTokensOptions) => void;
  reset: () => void;
}
export interface OAuthTokenStoreValue {
  completed: boolean;
  error: string;
  loading: boolean;
  successful: boolean;
  tokens: OAuth2Tokens | null | void;
}

export function initialize(initOptions?: GetTokensOptions) {
  const { set, subscribe }: Writable<OAuthTokenStoreValue> = writable({
    completed: false,
    error: '',
    loading: false,
    successful: false,
    tokens: null,
  });

  async function get(getOptions?: GetTokensOptions) {
    /**
     * Create an options object with getOptions overriding anything from initOptions
     */
    const options = {
      ...initOptions,
      ...getOptions,
    };

    let tokens: OAuth2Tokens | void;

    try {
      tokens = await TokenManager.getTokens(options);
    } catch (err: unknown) {
      console.error(`Get tokens | ${err}`);
      if (err instanceof Error) {
        set({
          completed: true,
          error: err.message,
          loading: false,
          successful: false,
          tokens: null,
        });
      }
      return;
    }

    set({
      completed: true,
      error: '',
      loading: false,
      successful: true,
      tokens: tokens,
    });
  }

  function reset() {
    set({
      completed: false,
      error: '',
      loading: false,
      successful: false,
      tokens: null,
    })
  }

  return {
    get,
    reset,
    subscribe,
  }
}
