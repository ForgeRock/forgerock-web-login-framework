/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * Shared mock factories for BFF route handler tests.
 *
 * Provides canonical test values, mock SvelteKit primitives, and the mutable
 * proxy pattern used to swap AM behavior per test without re-creating the runtime.
 */
import { Duration, Effect, Layer, Redacted, type ManagedRuntime } from 'effect';
import { Headers as PlatformHeaders } from '@effect/platform';
import type { Cookies } from '@sveltejs/kit';

import { AmProxyService, type AmProxy, type AmResponse } from '$server/services/am-proxy';
import { AppConfigService, type AppConfig } from '$server/services/app-config';
import { OidcDiscoveryService, type OidcEndpoints } from '$server/services/oidc-discovery';
import { RateLimiterService } from '$server/services/rate-limiter';
import { initializeTestRuntime, type AppServices } from '$server/run';

// ─── Canonical Test Values ───────────────────────────────────────────────────

export const testConfig: AppConfig = {
  amUrl: 'https://am.example.com/am',
  amCookieName: 'iPlanetDirectoryPro',
  realmPath: 'alpha',
  oauthClientId: 'TestClient',
  cookieSecrets: [Redacted.make('a-very-secret-key-that-is-at-least-32-chars')],
  cookieTtl: Duration.seconds(300),
  appDomain: 'localhost',
  appOrigin: 'http://localhost:5173',
  amRequestTimeout: Duration.millis(30_000),
  amMaxConcurrency: 50,
  rateLimitEnabled: false,
  rateLimitRpm: 60,
  rateLimitBurst: 10,
};

export const testOidcEndpoints: OidcEndpoints = {
  issuer: 'https://am.example.com/am/oauth2/realms/root/realms/alpha',
  authorization_endpoint: 'https://am.example.com/am/oauth2/realms/root/realms/alpha/authorize',
  token_endpoint: 'https://am.example.com/am/oauth2/realms/root/realms/alpha/access_token',
  userinfo_endpoint: 'https://am.example.com/am/oauth2/realms/root/realms/alpha/userinfo',
  end_session_endpoint:
    'https://am.example.com/am/oauth2/realms/root/realms/alpha/connect/endSession',
  revocation_endpoint: 'https://am.example.com/am/oauth2/realms/root/realms/alpha/token/revoke',
  jwks_uri: 'https://am.example.com/am/oauth2/realms/root/realms/alpha/connect/jwk_uri',
};

// ─── Mock SvelteKit Cookies ─────────────────────────────────────────────────

export const mockCookies = (): Cookies => {
  const store = new Map<string, string>();
  return {
    get: (name: string) => store.get(name),
    getAll: () => [...store].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => store.set(name, value),
    delete: (name: string) => store.delete(name),
    serialize: (name: string, value: string) => `${name}=${value}`,
  };
};

// ─── AM Response Builders ───────────────────────────────────────────────────

export const amSuccess = (body: string, status = 200): AmResponse => ({
  status,
  body,
  headers: PlatformHeaders.fromInput({}),
});

export const amErrorResponse = (status: number, message: string): AmResponse => ({
  status,
  body: JSON.stringify({ error: message }),
  headers: PlatformHeaders.fromInput({}),
});

// ─── SvelteKit RequestEvent Builder ─────────────────────────────────────────

interface ApiEventOptions {
  readonly method?: string;
  readonly url?: string;
  readonly body?: string;
  readonly headers?: Record<string, string>;
  readonly cookies?: Cookies;
}

/**
 * Build a minimal object castable to SvelteKit's RequestEvent.
 * Only includes the properties that route handlers actually read.
 */
export const createApiEvent = (opts: ApiEventOptions = {}) => {
  const method = opts.method ?? 'GET';
  const urlStr = opts.url ?? 'http://localhost:5173/api/test';
  const url = new URL(urlStr);
  const headers = new Headers(opts.headers);

  const request =
    method === 'GET' || method === 'HEAD'
      ? new Request(urlStr, { method, headers })
      : new Request(urlStr, { method, headers, body: opts.body ?? '' });

  return {
    request,
    url,
    cookies: opts.cookies ?? mockCookies(),
    getClientAddress: () => '127.0.0.1',
  };
};

// ─── Mutable Proxy + Runtime Factory ────────────────────────────────────────

/** Default proxy where every method dies — override specific methods per test */
const notUnderTest = (name: string) => () => Effect.die(new Error(`${name} not under test`));

export const buildAmProxy = (overrides: Partial<AmProxy> = {}): AmProxy => ({
  authenticate: notUnderTest('authenticate'),
  authorize: notUnderTest('authorize'),
  getTokens: notUnderTest('getTokens'),
  getUserInfo: notUnderTest('getUserInfo'),
  revokeTokens: notUnderTest('revokeTokens'),
  endSession: notUnderTest('endSession'),
  logout: notUnderTest('logout'),
  ...overrides,
});

/**
 * Create a delegating proxy + accessor for per-test behavior swapping.
 * Returns the delegating proxy (wire into the runtime once) and a setter
 * to swap behavior per test.
 */
export const createMutableProxy = (): {
  proxy: AmProxy;
  setProxy: (p: AmProxy) => void;
} => {
  let current: AmProxy = buildAmProxy();
  const proxy: AmProxy = {
    authenticate: (params) => current.authenticate(params),
    authorize: (params) => current.authorize(params),
    getTokens: (params) => current.getTokens(params),
    getUserInfo: (params) => current.getUserInfo(params),
    revokeTokens: (params) => current.revokeTokens(params),
    endSession: (params) => current.endSession(params),
    logout: (params) => current.logout(params),
  };
  return {
    proxy,
    setProxy: (p: AmProxy) => {
      current = p;
    },
  };
};

/** No-op rate limiter for tests — always allows requests */
const noopRateLimiter: RateLimiterService['Type'] = {
  checkRate: () => Effect.void,
};

/** Build a test Layer from the given proxy and optional overrides */
export const buildTestLayer = (
  proxy: AmProxy,
  opts?: {
    discovery?: Partial<{
      endpoints: Effect.Effect<OidcEndpoints>;
      isReady: Effect.Effect<boolean>;
    }>;
  },
): Layer.Layer<AppServices> =>
  Layer.mergeAll(
    Layer.succeed(AppConfigService, new AppConfigService(testConfig)),
    Layer.succeed(AmProxyService, proxy),
    Layer.succeed(
      OidcDiscoveryService,
      new OidcDiscoveryService({
        endpoints: opts?.discovery?.endpoints ?? Effect.succeed(testOidcEndpoints),
        isReady: opts?.discovery?.isReady ?? Effect.succeed(true),
      }),
    ),
    Layer.succeed(RateLimiterService, noopRateLimiter),
  );

/**
 * Initialize a test runtime with a mutable proxy. Returns the runtime,
 * delegating proxy, and setter. Caller must `runtime.dispose()` in afterAll.
 */
export const setupRouteTestRuntime = (): {
  runtime: ManagedRuntime.ManagedRuntime<AppServices, never>;
  proxy: AmProxy;
  setProxy: (p: AmProxy) => void;
} => {
  const { proxy, setProxy } = createMutableProxy();
  const layer = buildTestLayer(proxy);
  const runtime = initializeTestRuntime(layer);
  return { runtime, proxy, setProxy };
};
