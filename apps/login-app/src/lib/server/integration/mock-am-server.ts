/**
 * Mock AM HTTP server for E2E tests.
 *
 * A lightweight stateful `node:http` server simulating ForgeRock AM's
 * /authenticate endpoint and OIDC discovery. Unlike MSW (which patches
 * `fetch` in the current process), this runs as a real HTTP server —
 * required when the SvelteKit BFF runs as a subprocess.
 *
 * Uses a response queue pattern: tests call `mockAm.enqueue(response)`
 * before each browser interaction. The mock pops from the queue on
 * each POST /authenticate request, returning the next canned response.
 */
import { createServer, type Server } from 'node:http';

// ─── Constants ───────────────────────────────────────────────────────────────

const REALM_JSON = '/json/realms/root/realms/alpha';
const REALM_OAUTH = '/oauth2/realms/root/realms/alpha';

/**
 * Fake authId JWT — the BFF doesn't validate it, just round-trips it.
 * This is a valid JWT structure (header.payload.signature) but with
 * nonsense payload. The BFF stores it in an encrypted cookie and sends
 * it back to AM on the next step.
 */
const FAKE_AUTH_ID =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoSWQiOiJtb2NrLWF1dGgtaWQifQ.mock-signature';

export const MOCK_SSO_TOKEN = 'mock-sso-token';

// ─── Response Types ──────────────────────────────────────────────────────────

interface MockAmResponse {
  /** HTTP status code (default: 200) */
  readonly status?: number;
  /** JSON response body */
  readonly body: string;
  /** Optional Set-Cookie header value */
  readonly setCookie?: string;
}

// ─── Pre-built Response Factories ────────────────────────────────────────────

/** AM step response with NameCallback + PasswordCallback (login flow) */
export const loginStep = (): MockAmResponse => ({
  body: JSON.stringify({
    authId: FAKE_AUTH_ID,
    callbacks: [
      {
        type: 'NameCallback',
        output: [{ name: 'prompt', value: 'User Name' }],
        input: [{ name: 'IDToken1', value: '' }],
        _id: 0,
      },
      {
        type: 'PasswordCallback',
        output: [{ name: 'prompt', value: 'Password' }],
        input: [{ name: 'IDToken2', value: '' }],
        _id: 1,
      },
    ],
  }),
});

/**
 * AM step response with registration-style callbacks:
 * StringAttributeCallback (email, first name, last name),
 * PasswordCallback, and BooleanAttributeInputCallback (terms).
 */
export const registrationStep = (): MockAmResponse => ({
  body: JSON.stringify({
    authId: FAKE_AUTH_ID,
    callbacks: [
      {
        type: 'StringAttributeCallback',
        output: [
          { name: 'prompt', value: 'Email Address' },
          { name: 'name', value: 'mail' },
        ],
        input: [{ name: 'IDToken1', value: '' }],
        _id: 0,
      },
      {
        type: 'StringAttributeCallback',
        output: [
          { name: 'prompt', value: 'First Name' },
          { name: 'name', value: 'givenName' },
        ],
        input: [{ name: 'IDToken2', value: '' }],
        _id: 1,
      },
      {
        type: 'StringAttributeCallback',
        output: [
          { name: 'prompt', value: 'Last Name' },
          { name: 'name', value: 'sn' },
        ],
        input: [{ name: 'IDToken3', value: '' }],
        _id: 2,
      },
      {
        type: 'PasswordCallback',
        output: [{ name: 'prompt', value: 'Password' }],
        input: [{ name: 'IDToken4', value: '' }],
        _id: 3,
      },
      {
        type: 'BooleanAttributeInputCallback',
        output: [
          { name: 'prompt', value: 'Accept Terms and Conditions' },
          { name: 'name', value: 'preferences/marketing' },
        ],
        input: [{ name: 'IDToken5', value: false }],
        _id: 4,
      },
    ],
  }),
});

/** AM step response with a single NameCallback for OTP (multi-step flow) */
export const otpStep = (): MockAmResponse => ({
  body: JSON.stringify({
    authId: FAKE_AUTH_ID,
    callbacks: [
      {
        type: 'NameCallback',
        output: [{ name: 'prompt', value: 'One Time Password' }],
        input: [{ name: 'IDToken1', value: '' }],
        _id: 0,
      },
    ],
  }),
});

/** AM auth completion response with SSO cookie */
export const authComplete = (): MockAmResponse => ({
  body: JSON.stringify({ tokenId: MOCK_SSO_TOKEN }),
  setCookie: `iPlanetDirectoryPro=${MOCK_SSO_TOKEN}; Path=/; HttpOnly`,
});

/** AM authentication error (invalid credentials, account locked, etc.) */
export const authError = (message = 'Authentication Failed'): MockAmResponse => ({
  status: 401,
  body: JSON.stringify({ code: 401, reason: 'Unauthorized', message }),
});

/** AM internal server error (500) */
export const amServerError = (): MockAmResponse => ({
  status: 500,
  body: JSON.stringify({
    code: 500,
    reason: 'Internal Server Error',
    message: 'Something went wrong',
  }),
});

/** AM malformed response (non-JSON body, e.g. reverse proxy 502) */
export const amMalformedResponse = (): MockAmResponse => ({
  body: '<html>502 Bad Gateway</html>',
});

// ─── OIDC Discovery ──────────────────────────────────────────────────────────

const buildDiscoveryDoc = (baseUrl: string) => ({
  issuer: `${baseUrl}${REALM_OAUTH}`,
  authorization_endpoint: `${baseUrl}${REALM_OAUTH}/authorize`,
  token_endpoint: `${baseUrl}${REALM_OAUTH}/access_token`,
  userinfo_endpoint: `${baseUrl}${REALM_OAUTH}/userinfo`,
  end_session_endpoint: `${baseUrl}${REALM_OAUTH}/connect/endSession`,
  revocation_endpoint: `${baseUrl}${REALM_OAUTH}/token/revoke`,
  jwks_uri: `${baseUrl}${REALM_OAUTH}/connect/jwk_uri`,
});

// ─── Server ──────────────────────────────────────────────────────────────────

interface MockAmServer {
  /** Base URL including /am prefix, e.g. "http://127.0.0.1:12345/am" */
  readonly baseUrl: string;
  /**
   * Enqueue a response for the next POST /authenticate request.
   * Responses are consumed in FIFO order. Each POST pops one response.
   */
  readonly enqueue: (...responses: ReadonlyArray<MockAmResponse>) => void;
  /** Shut down the mock AM server */
  readonly close: () => Promise<void>;
}

/**
 * Start a mock AM HTTP server on an OS-assigned port.
 *
 * Routes:
 * - POST /am/json/realms/root/realms/alpha/authenticate
 *     Pops the next response from the queue. Fails if queue is empty.
 * - GET /am/oauth2/realms/root/realms/alpha/authorize
 *     Static: extracts redirect_uri, returns 302 with ?code=mock-auth-code
 * - POST /am/oauth2/realms/root/realms/alpha/access_token
 *     Static: returns mock OAuth tokens (access_token, token_type, etc.)
 * - POST /am/json/realms/root/realms/alpha/sessions/
 *     Static: returns 200 with "Successfully logged out"
 * - GET /am/oauth2/realms/root/realms/alpha/.well-known/openid-configuration
 *     Returns OIDC discovery document
 */
export const startMockAm = (): Promise<MockAmServer> =>
  new Promise((resolve, reject) => {
    const responseQueue: MockAmResponse[] = [];

    const server: Server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
      const pathname = url.pathname;

      // POST /am/.../authenticate — pop next response from queue
      if (req.method === 'POST' && pathname === `/am${REALM_JSON}/authenticate`) {
        // Drain request body (required for node:http)
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
          const next = responseQueue.shift();
          if (!next) {
            res.writeHead(500, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ error: 'Mock AM: response queue is empty' }));
            return;
          }

          const headers: Record<string, string> = { 'content-type': 'application/json' };
          if (next.setCookie) {
            headers['set-cookie'] = next.setCookie;
          }
          res.writeHead(next.status ?? 200, headers);
          res.end(next.body);
        });
        return;
      }

      // GET /am/.../authorize — OAuth2 authorize (static, not queue-based)
      // Returns 302 with Location header pointing to redirect_uri + ?code=mock-auth-code.
      // The BFF's FetchHttpClient uses redirect: 'manual', so it reads the Location header
      // without following the redirect.
      if (req.method === 'GET' && pathname === `/am${REALM_OAUTH}/authorize`) {
        const redirectUri = url.searchParams.get('redirect_uri') ?? 'http://localhost/callback';
        res.writeHead(302, {
          location: `${redirectUri}?code=mock-auth-code`,
        });
        res.end();
        return;
      }

      // POST /am/.../access_token — OAuth2 token exchange (static, not queue-based)
      // Returns a mock access token. The BFF proxies this as-is to the customer.
      if (req.method === 'POST' && pathname === `/am${REALM_OAUTH}/access_token`) {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(
            JSON.stringify({
              access_token: 'mock-access-token',
              token_type: 'Bearer',
              expires_in: 3600,
              scope: 'openid profile',
              id_token: 'mock-id-token',
            }),
          );
        });
        return;
      }

      // POST /am/.../sessions/ — AM session logout (static, not queue-based)
      if (req.method === 'POST' && pathname.startsWith(`/am${REALM_JSON}/sessions`)) {
        // Drain request body
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ result: 'Successfully logged out' }));
        });
        return;
      }

      // GET /am/.../.well-known/openid-configuration — OIDC discovery
      if (
        req.method === 'GET' &&
        pathname === `/am${REALM_OAUTH}/.well-known/openid-configuration`
      ) {
        const addr = server.address();
        const port = typeof addr === 'object' && addr ? addr.port : 0;
        const baseUrl = `http://127.0.0.1:${port}/am`;
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(buildDiscoveryDoc(baseUrl)));
        return;
      }

      // Fallback — 404 for unhandled routes
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end(`Mock AM: unhandled ${req.method} ${pathname}`);
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to get mock AM address'));
        return;
      }
      resolve({
        baseUrl: `http://127.0.0.1:${addr.port}/am`,
        enqueue: (...responses) => responseQueue.push(...responses),
        close: () =>
          new Promise<void>((res, rej) => server.close((err) => (err ? rej(err) : res()))),
      });
    });

    server.on('error', reject);
  });
