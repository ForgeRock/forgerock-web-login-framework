import { TokenManager, type GetTokensOptions, type OAuth2Tokens } from '@forgerock/javascript-sdk';
import { writable, type Writable } from 'svelte/store';

import type { Maybe } from '$lib/interfaces';

const authorizationTimedOut = 'Authorization timed out';
const interactionNeeded = 'The request requires some interaction that is not allowed.';
const timeoutErrorMessage =
  'Timeouts are likely an issue with OAuth client misconfiguration. If you are getting a 4xx error in the network tab, copy the full `/authorize` URL and paste it directly into your browsers URL field to directly visit the page. The error should be displayed on the page.';
const sessionCookieConsentMessage = `The user either doesn't have a valid session, the cookie is not being sent due to third-party cookies being disabled, or the user is needing to provide consent as the OAuth client setting does not have "implied consent" enabled.`;

export interface OAuthStore extends Pick<Writable<OAuthTokenStoreValue>, 'subscribe'> {
  get: (getOptions?: GetTokensOptions) => void;
  reset: () => void;
}
export interface OAuthTokenStoreValue {
  completed: boolean;
  error: Maybe<{
    code?: Maybe<number>;
    message: Maybe<string>;
    troubleshoot: Maybe<string>;
  }>;
  loading: boolean;
  successful: boolean;
  response: Maybe<OAuth2Tokens> | void;
}

export const oauthStore: Writable<OAuthTokenStoreValue> = writable({
  completed: false,
  error: null,
  loading: false,
  successful: false,
  response: null,
});

function getTroubleshootingMessage(message: string) {
  switch (message) {
    case interactionNeeded:
      return sessionCookieConsentMessage;
    case authorizationTimedOut:
      return timeoutErrorMessage;
    default:
      return '';
  }
}

/**
 * @function initialize - Initializes the OAuth store with a get function and a reset function
 * @param {object} initOptions - The options to pass to the TokenManager.getTokens function
 * @returns {object} - The OAuth store
 * @example initialize({ query: { prompt: 'none' } });
 */
export function initialize(initOptions?: GetTokensOptions) {
  /**
   * Get tokens from the server
   * new tokens are available in the subscribe method
   * @params: getOptions?: GetTokensOptions
   * @returns: Promise<void>
   */
  async function get(getOptions?: GetTokensOptions) {
    /**
     * Create an options object with getOptions overriding anything from initOptions
     * TODO: Does this object merge need to be more granular?
     */
    const options = {
      ...{ query: { prompt: 'none' } },
      ...initOptions,
      ...getOptions,
    };

    let tokens: OAuth2Tokens | void;

    oauthStore.set({
      completed: false,
      error: null,
      loading: true,
      successful: false,
      response: null,
    });

    try {
      tokens = await TokenManager.getTokens(options);
    } catch (err: unknown) {
      if (err instanceof Error) {
        oauthStore.set({
          completed: true,
          error: {
            message: err.message,
            troubleshoot: getTroubleshootingMessage(err.message),
          },
          loading: false,
          successful: false,
          response: null,
        });
      }
      return;
    }

    oauthStore.set({
      completed: true,
      error: null,
      loading: false,
      successful: true,
      response: tokens,
    });
  }

  function reset() {
    oauthStore.set({
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
    subscribe: oauthStore.subscribe,
  };
}
