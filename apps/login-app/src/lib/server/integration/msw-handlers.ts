/**
 * MSW request handlers that simulate ForgeRock AM API responses.
 *
 * These handlers intercept the BFF's outbound fetch() calls to AM.
 * The AM base URL must match the VITE_FR_AM_URL env var used by the
 * built SvelteKit server.
 */
import { http, HttpResponse } from 'msw';

/** Base URL used for AM in integration tests — arbitrary since MSW intercepts fetch */
export const MOCK_AM_BASE = 'https://am.test.local/am';

const REALM = '/oauth2/realms/root/realms/alpha';
const JSON_REALM = '/json/realms/root/realms/alpha';

// ─── OIDC Discovery Document ─────────────────────────────────────────────────

const discoveryDoc = {
  issuer: `${MOCK_AM_BASE}${REALM}`,
  authorization_endpoint: `${MOCK_AM_BASE}${REALM}/authorize`,
  token_endpoint: `${MOCK_AM_BASE}${REALM}/access_token`,
  userinfo_endpoint: `${MOCK_AM_BASE}${REALM}/userinfo`,
  end_session_endpoint: `${MOCK_AM_BASE}${REALM}/connect/endSession`,
  revocation_endpoint: `${MOCK_AM_BASE}${REALM}/token/revoke`,
  jwks_uri: `${MOCK_AM_BASE}${REALM}/connect/jwk_uri`,
};

// ─── Default Handlers ────────────────────────────────────────────────────────

export const amHandlers = [
  /** OIDC well-known — required for server startup (OidcDiscoveryService) */
  http.get(`${MOCK_AM_BASE}${REALM}/.well-known/openid-configuration`, () =>
    HttpResponse.json(discoveryDoc),
  ),

  /** Token exchange — returns a mock access token */
  http.post(`${MOCK_AM_BASE}${REALM}/access_token`, () =>
    HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
    }),
  ),

  /** Userinfo — returns mock user claims */
  http.get(`${MOCK_AM_BASE}${REALM}/userinfo`, () =>
    HttpResponse.json({ sub: 'user-123', name: 'Test User' }),
  ),

  /**
   * OAuth2 authorize — simulates AM's redirect response.
   *
   * Real AM returns 302 with Location. The BFF's FetchHttpClient uses
   * `redirect: 'manual'` to receive the raw redirect without following it,
   * then reads the Location header to build the customer-facing redirect.
   *
   * MSW intercepts fetch at the transport level, so `redirect: 'manual'`
   * is honored — MSW returns the 302 response directly without following it.
   */
  http.get(`${MOCK_AM_BASE}${REALM}/authorize`, ({ request }) => {
    const url = new URL(request.url);
    const redirectUri = url.searchParams.get('redirect_uri') ?? 'http://localhost';
    return new HttpResponse(null, {
      status: 302,
      headers: { location: `${redirectUri}?code=mock-auth-code` },
    });
  }),

  /** Token revocation */
  http.post(`${MOCK_AM_BASE}${REALM}/token/revoke`, () => HttpResponse.json({})),

  /** End session (RP-Initiated Logout) */
  http.get(`${MOCK_AM_BASE}${REALM}/connect/endSession`, () => HttpResponse.json({})),

  /** AM session logout */
  http.post(`${MOCK_AM_BASE}${JSON_REALM}/sessions/`, () =>
    HttpResponse.json({ result: 'Successfully logged out' }),
  ),

  /** AM authenticate (for completeness — not tested in integration tier) */
  http.post(`${MOCK_AM_BASE}${JSON_REALM}/authenticate`, () =>
    HttpResponse.json({ tokenId: 'mock-sso-token' }),
  ),
];
