import { type Headers } from '@effect/platform';
import { Context, Effect } from 'effect';

import type { AmError, AmUnreachable, ServiceUnavailable } from '$server/errors';

export interface AmResponse {
  readonly status: number;
  readonly body: string;
  readonly headers: Headers.Headers;
}

export interface AmProxy {
  /**
   * POST /json/realms/.../authenticate — proxies the full query string from client.
   * Returns the full AM response regardless of status code (AM uses non-2xx
   * during multi-step auth and includes Set-Cookie headers on those responses).
   */
  readonly authenticate: (params: {
    readonly body: string;
    readonly cookie: string;
    readonly queryString: string;
  }) => Effect.Effect<AmResponse, AmUnreachable>;

  /** GET /oauth2/realms/.../authorize — returns the redirect URL from AM's response */
  readonly authorize: (params: {
    readonly cookie: string;
    readonly queryString: string;
  }) => Effect.Effect<
    { readonly redirectUrl: string },
    AmUnreachable | AmError | ServiceUnavailable
  >;

  /** POST /oauth2/realms/.../access_token */
  readonly getTokens: (params: {
    readonly body: string;
  }) => Effect.Effect<AmResponse, AmUnreachable | AmError | ServiceUnavailable>;

  /** GET /oauth2/realms/.../userinfo */
  readonly getUserInfo: (params: {
    readonly authorization: string;
  }) => Effect.Effect<AmResponse, AmUnreachable | AmError | ServiceUnavailable>;

  /** POST /oauth2/realms/.../token/revoke */
  readonly revokeTokens: (params: {
    readonly body: string;
  }) => Effect.Effect<AmResponse, AmUnreachable | AmError | ServiceUnavailable>;

  /** GET /oauth2/realms/.../connect/endSession */
  readonly endSession: (params: {
    readonly authorization: string;
    readonly queryString: string;
  }) => Effect.Effect<AmResponse, AmUnreachable | AmError | ServiceUnavailable>;

  /** POST /json/realms/.../sessions/?_action=logout */
  readonly logout: (params: {
    readonly cookie: string;
    readonly queryString: string;
  }) => Effect.Effect<AmResponse, AmUnreachable | AmError>;
}

export class AmProxyService extends Context.Tag('AmProxyService')<AmProxyService, AmProxy>() {}
