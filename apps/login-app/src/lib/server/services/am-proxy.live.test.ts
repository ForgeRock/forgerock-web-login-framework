/**
 * AmProxyLive integration tests
 *
 * Tests retry policies, concurrency limits, and error classification
 * using a mock HTTP client layer. Each test wires up AmProxyLive with
 * a test HttpClient that simulates connection errors, timeouts, and
 * delayed responses.
 */
import { describe, expect, it } from 'vitest';
import { Duration, Effect, Exit, Layer } from 'effect';
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
  HttpClientError,
} from '@effect/platform';

import { testConfig, testOidcEndpoints } from '$server/route-test-helpers';
import { AppConfigService } from './app-config';
import { OidcDiscoveryService } from './oidc-discovery';
import { AmProxyService, type AmProxy } from './am-proxy';
import { AmProxyLive } from './am-proxy.live';

// ─── Test Helpers ────────────────────────────────────────────────────────────

/** Count how many times the mock HTTP client was called. */
const makeCallCounter = () => {
  let count = 0;
  return {
    increment: () => {
      count++;
    },
    get count() {
      return count;
    },
  };
};

/**
 * Build a minimal HttpClientResponse from a status code and body string.
 */
const mockResponse = (status: number, body: string): HttpClientResponse.HttpClientResponse =>
  HttpClientResponse.fromWeb(
    HttpClientRequest.get('/'),
    new Response(body, {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  );

const mockRedirectResponse = (
  status: number,
  location: string,
): HttpClientResponse.HttpClientResponse =>
  HttpClientResponse.fromWeb(
    HttpClientRequest.get('/'),
    new Response(null, {
      status,
      headers: { location },
    }),
  );

const OidcLayer = Layer.succeed(
  OidcDiscoveryService,
  new OidcDiscoveryService({
    endpoints: Effect.succeed(testOidcEndpoints),
    isReady: Effect.succeed(true),
  }),
);

const ConfigLayer = Layer.succeed(
  AppConfigService,
  new AppConfigService({
    ...testConfig,
    amRequestTimeout: Duration.millis(500),
    amMaxConcurrency: 2,
  }),
);

/**
 * Build a mock RequestError for simulating connection failures.
 * The AmProxyLive layer's `amClient` wraps HttpClient.catchTags to convert
 * RequestError → AmUnreachable(kind: 'connection').
 */
const connectionError = (req: HttpClientRequest.HttpClientRequest) =>
  new HttpClientError.RequestError({
    request: req,
    reason: 'Transport',
    cause: new Error('ECONNREFUSED'),
  });

/**
 * Build a test layer with a mock HttpClient that calls the provided handler.
 */
const buildTestLayer = (
  handler: (
    req: HttpClientRequest.HttpClientRequest,
  ) => Effect.Effect<HttpClientResponse.HttpClientResponse, HttpClientError.HttpClientError>,
) => {
  const mockHttpClient = HttpClient.make((req) => handler(req));
  const HttpLayer = Layer.succeed(HttpClient.HttpClient, mockHttpClient);

  return AmProxyLive.pipe(Layer.provide(Layer.mergeAll(ConfigLayer, HttpLayer, OidcLayer)));
};

/** Run an effect against an AmProxyLive built with the given mock HTTP handler. */
const runWithProxy = <A, E>(
  handler: (
    req: HttpClientRequest.HttpClientRequest,
  ) => Effect.Effect<HttpClientResponse.HttpClientResponse, HttpClientError.HttpClientError>,
  effect: (proxy: AmProxy) => Effect.Effect<A, E>,
) =>
  Effect.gen(function* () {
    const proxy = yield* AmProxyService;
    return yield* effect(proxy);
  }).pipe(Effect.provide(buildTestLayer(handler)), Effect.runPromise);

// ─── authenticate ────────────────────────────────────────────────────────────

describe('authenticate', () => {
  it('authenticate_Success_ReturnsAmResponse', async () => {
    const result = await runWithProxy(
      () => Effect.succeed(mockResponse(200, '{"authId":"test","callbacks":[]}')),
      (proxy) => proxy.authenticate({ body: '{}', cookie: '', queryString: '' }),
    );

    expect(result.status).toBe(200);
    expect(result.body).toContain('authId');
  });

  it('authenticate_ConnectionError_RetriesUpTo3Times', async () => {
    const counter = makeCallCounter();

    const exit = await Effect.gen(function* () {
      const proxy = yield* AmProxyService;
      return yield* proxy.authenticate({ body: '{}', cookie: '', queryString: '' });
    }).pipe(
      Effect.provide(
        buildTestLayer((req) => {
          counter.increment();
          return Effect.fail(connectionError(req));
        }),
      ),
      Effect.exit,
      Effect.runPromise,
    );

    expect(Exit.isFailure(exit)).toBe(true);
    // Initial attempt + 2 retries = 3 total
    expect(counter.count).toBe(3);
  });

  it('authenticate_ConnectionThenSuccess_RetriesAndSucceeds', async () => {
    const counter = makeCallCounter();

    const result = await runWithProxy(
      (req) => {
        counter.increment();
        if (counter.count <= 1) {
          return Effect.fail(connectionError(req));
        }
        return Effect.succeed(mockResponse(200, '{"authId":"test","callbacks":[]}'));
      },
      (proxy) => proxy.authenticate({ body: '{}', cookie: '', queryString: '' }),
    );

    expect(counter.count).toBe(2);
    expect(result.status).toBe(200);
  });
});

// ─── logout ──────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('logout_ConnectionError_RetriesUpTo3Times', async () => {
    const counter = makeCallCounter();

    const exit = await Effect.gen(function* () {
      const proxy = yield* AmProxyService;
      return yield* proxy.logout({ cookie: 'token=abc', queryString: '_action=logout' });
    }).pipe(
      Effect.provide(
        buildTestLayer((req) => {
          counter.increment();
          return Effect.fail(connectionError(req));
        }),
      ),
      Effect.exit,
      Effect.runPromise,
    );

    expect(Exit.isFailure(exit)).toBe(true);
    expect(counter.count).toBe(3);
  });

  it('logout_Success_ReturnsAmResponse', async () => {
    const result = await runWithProxy(
      () => Effect.succeed(mockResponse(200, '{"result":"ok"}')),
      (proxy) => proxy.logout({ cookie: 'token=abc', queryString: '_action=logout' }),
    );

    expect(result.status).toBe(200);
  });

  it('logout_Non2xx_FailsWithAmError', async () => {
    const exit = await Effect.gen(function* () {
      const proxy = yield* AmProxyService;
      return yield* proxy.logout({ cookie: 'token=abc', queryString: '_action=logout' });
    }).pipe(
      Effect.provide(
        buildTestLayer(() => Effect.succeed(mockResponse(401, '{"error":"Unauthorized"}'))),
      ),
      Effect.exit,
      Effect.runPromise,
    );

    expect(Exit.isFailure(exit)).toBe(true);
  });
});

// ─── getTokens ───────────────────────────────────────────────────────────────

describe('getTokens', () => {
  it('getTokens_Success_ReturnsAmResponse', async () => {
    const result = await runWithProxy(
      () => Effect.succeed(mockResponse(200, '{"access_token":"xyz"}')),
      (proxy) => proxy.getTokens({ body: 'grant_type=authorization_code&code=abc123' }),
    );

    expect(result.status).toBe(200);
    expect(result.body).toContain('access_token');
  });

  it('getTokens_ConnectionError_DoesNotRetry', async () => {
    const counter = makeCallCounter();

    const exit = await Effect.gen(function* () {
      const proxy = yield* AmProxyService;
      return yield* proxy.getTokens({ body: 'grant_type=authorization_code&code=abc123' });
    }).pipe(
      Effect.provide(
        buildTestLayer((req) => {
          counter.increment();
          return Effect.fail(connectionError(req));
        }),
      ),
      Effect.exit,
      Effect.runPromise,
    );

    expect(Exit.isFailure(exit)).toBe(true);
    // Single-use auth code: NO retries at all
    expect(counter.count).toBe(1);
  });

  it('getTokens_Non2xx_FailsWithAmError', async () => {
    const exit = await Effect.gen(function* () {
      const proxy = yield* AmProxyService;
      return yield* proxy.getTokens({ body: 'grant_type=authorization_code&code=expired' });
    }).pipe(
      Effect.provide(
        buildTestLayer(() => Effect.succeed(mockResponse(400, '{"error":"invalid_grant"}'))),
      ),
      Effect.exit,
      Effect.runPromise,
    );

    expect(Exit.isFailure(exit)).toBe(true);
  });
});

// ─── authorize ───────────────────────────────────────────────────────────────

describe('authorize', () => {
  it('authorize_Success_ReturnsRedirectUrl', async () => {
    const result = await runWithProxy(
      () =>
        Effect.succeed(mockRedirectResponse(302, 'https://app.example.com/callback?code=abc123')),
      (proxy) =>
        proxy.authorize({ cookie: 'token=abc', queryString: 'response_type=code&scope=openid' }),
    );

    expect(result.redirectUrl).toBe('https://app.example.com/callback?code=abc123');
  });

  it('authorize_NoLocation_FailsWithAmError', async () => {
    const exit = await Effect.gen(function* () {
      const proxy = yield* AmProxyService;
      return yield* proxy.authorize({
        cookie: 'token=abc',
        queryString: 'response_type=code&scope=openid',
      });
    }).pipe(
      Effect.provide(
        buildTestLayer(() => Effect.succeed(mockResponse(200, '{"error":"consent_required"}'))),
      ),
      Effect.exit,
      Effect.runPromise,
    );

    expect(Exit.isFailure(exit)).toBe(true);
  });
});

// ─── amFetch (via getUserInfo) ───────────────────────────────────────────────

describe('amFetch (via getUserInfo)', () => {
  it('getUserInfo_Non2xx_FailsWithAmError', async () => {
    const exit = await Effect.gen(function* () {
      const proxy = yield* AmProxyService;
      return yield* proxy.getUserInfo({ authorization: 'Bearer expired-token' });
    }).pipe(
      Effect.provide(
        buildTestLayer(() => Effect.succeed(mockResponse(401, '{"error":"invalid_token"}'))),
      ),
      Effect.exit,
      Effect.runPromise,
    );

    expect(Exit.isFailure(exit)).toBe(true);
  });

  it('getUserInfo_Success_ReturnsAmResponse', async () => {
    const result = await runWithProxy(
      () => Effect.succeed(mockResponse(200, '{"sub":"user123"}')),
      (proxy) => proxy.getUserInfo({ authorization: 'Bearer valid-token' }),
    );

    expect(result.status).toBe(200);
    expect(result.body).toContain('user123');
  });
});
