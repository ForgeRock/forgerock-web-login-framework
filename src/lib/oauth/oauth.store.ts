import { TokenManager, type GetTokensOptions, type OAuth2Tokens } from '@forgerock/javascript-sdk';
import { writable, type Writable } from 'svelte/store';

export interface OAuthStore extends Pick<Writable<OAuthTokenStoreValue>, 'subscribe'> {
  get: (getOptions?: GetTokensOptions) => void;
  reset: () => void;
}
export interface OAuthTokenStoreValue {
  completed: boolean;
  error: {
    code?: number | null;
    message: string | null;
  } | null;
  loading: boolean;
  successful: boolean;
  response: OAuth2Tokens | null | void;
}

export function initialize(initOptions?: GetTokensOptions) {
  const { set, subscribe }: Writable<OAuthTokenStoreValue> = writable({
    completed: false,
    error: null,
    loading: false,
    successful: false,
    response: null,
  });

  async function get(getOptions?: GetTokensOptions) {
    /**
     * Create an options object with getOptions overriding anything from initOptions
     * TODO: Does this object merge need to be more granular?
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
          error: {
            message: err.message,
          },
          loading: false,
          successful: false,
          response: null,
        });
      }
      return;
    }

    set({
      completed: true,
      error: null,
      loading: false,
      successful: true,
      response: tokens,
    });
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
