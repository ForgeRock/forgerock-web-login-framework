/**
 *
 * Copyright © 2025 - 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { get as getStoreValue, writable } from 'svelte/store';

import type { GetTokensOptions, OauthTokens, OidcClient } from '@forgerock/oidc-client/types';
import type { Readable, Writable } from 'svelte/store';

import type { Maybe } from '$core/interfaces';
import type { OidcClientConfig } from '$core/oidc/oidc.store';

const authorizationTimedOut = 'Authorization timed out';
const interactionNeeded = 'The request requires some interaction that is not allowed.';
const timeoutErrorMessage =
  'Timeouts are likely an issue with OAuth client misconfiguration. If you are getting a 4xx error in the network tab, copy the full `/authorize` URL and paste it directly into your browsers URL field to directly visit the page. The error should be displayed on the page.';
const sessionCookieConsentMessage = `The user either doesn't have a valid session, the cookie is not being sent due to third-party cookies being disabled, or the user is needing to provide consent as the OAuth client setting does not have "implied consent" enabled.`;

export interface OAuthStore extends Pick<Writable<OAuthTokenStoreValue>, 'subscribe'> {
  get: (getOptions?: GetTokensOptions) => Promise<OAuthTokenStoreValue>;
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
  response: Maybe<OauthTokens> | void;
}

function getTroubleshootingMessage(message: Maybe<string>) {
  switch (message) {
    case interactionNeeded:
      return sessionCookieConsentMessage;
    case authorizationTimedOut:
      return timeoutErrorMessage;
    default:
      return '';
  }
}

const INITIAL_STATE: OAuthTokenStoreValue = {
  completed: false,
  error: null,
  loading: false,
  successful: false,
  response: null,
};

/**
 * @function initialize - Initializes the OAuth store with a get function and a reset function
 * @param {Readable<OidcClient | null>} oidcClientStore - The OIDC client store to read the client from
 * @param {OidcClientConfig} oidcConfig - The OIDC client config; used to build authorizeOptions for token.get
 * @returns {OAuthStore} - The OAuth store
 */
export function initialize(
  oidcClientStore: Readable<OidcClient | null> | undefined,
  oidcConfig?: Omit<OidcClientConfig, 'serverConfig'>,
): OAuthStore {
  const oauthStore = writable<OAuthTokenStoreValue>(INITIAL_STATE);

  const authorizeOptions = oidcConfig
    ? {
        clientId: oidcConfig.clientId,
        redirectUri: oidcConfig.redirectUri,
        scope: oidcConfig.scope ?? 'openid',
        responseType: 'code' as const,
        ...(oidcConfig.loginHint && { loginHint: oidcConfig.loginHint }),
        ...(oidcConfig.acrValues && { acrValues: oidcConfig.acrValues }),
        ...(oidcConfig.query && { query: oidcConfig.query }),
      }
    : undefined;

  async function get(getOptions?: GetTokensOptions) {
    if (!oidcClientStore) {
      oauthStore.set({
        completed: true,
        error: { message: 'OIDC client not configured', troubleshoot: null },
        loading: false,
        successful: false,
        response: null,
      });
      return getStoreValue(oauthStore);
    }

    const options = {
      ...(authorizeOptions && { authorizeOptions }),
      ...getOptions,
    };

    const oidcClient = getStoreValue(oidcClientStore);

    if (!oidcClient) {
      oauthStore.set({
        completed: true,
        error: { message: 'OIDC client not ready', troubleshoot: null },
        loading: false,
        successful: false,
        response: null,
      });
      return getStoreValue(oauthStore);
    }

    if ('error' in oidcClient) {
      oauthStore.set({
        completed: true,
        error: { message: String(oidcClient.error), troubleshoot: null },
        loading: false,
        successful: false,
        response: null,
      });
      return getStoreValue(oauthStore);
    }

    const currentState = getStoreValue(oauthStore);
    if (currentState.loading || currentState.completed) {
      return currentState;
    }

    oauthStore.set({ ...INITIAL_STATE, loading: true });

    try {
      const tokens = await oidcClient.token.get(options);

      if ('error' in tokens) {
        const message =
          ('message' in tokens && tokens.message) ||
          ('error_description' in tokens && tokens.error_description) ||
          tokens.error;
        const code = 'code' in tokens && typeof tokens.code === 'number' ? tokens.code : null;
        oauthStore.set({
          completed: true,
          error: { code, message, troubleshoot: getTroubleshootingMessage(message) },
          loading: false,
          successful: false,
          response: null,
        });
        return getStoreValue(oauthStore);
      }

      oauthStore.set({
        completed: true,
        error: null,
        loading: false,
        successful: true,
        response: tokens,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown OAuth error';
      oauthStore.set({
        completed: true,
        error: { message, troubleshoot: getTroubleshootingMessage(message) },
        loading: false,
        successful: false,
        response: null,
      });
    }

    return getStoreValue(oauthStore);
  }

  function reset() {
    oauthStore.set(INITIAL_STATE);
  }

  return {
    get,
    reset,
    subscribe: oauthStore.subscribe,
  };
}
