import { describe, expect, it } from 'vitest';
import {
  ConfigProvider,
  Duration,
  Effect,
  Exit,
  Fiber,
  Layer,
  Ref,
  Schedule,
  TestClock,
  TestContext,
} from 'effect';
import {
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from '@effect/platform';

import { AppConfigService } from './app-config';
import { OidcDiscoveryService, type OidcEndpoints } from './oidc-discovery';

// ─── Test Fixtures ──────────────────────────────────────────────────────────

const validEndpoints: OidcEndpoints = {
  issuer: 'https://am.example.com/am/oauth2/realms/root/realms/alpha',
  authorization_endpoint: 'https://am.example.com/am/oauth2/realms/root/realms/alpha/authorize',
  token_endpoint: 'https://am.example.com/am/oauth2/realms/root/realms/alpha/access_token',
  userinfo_endpoint: 'https://am.example.com/am/oauth2/realms/root/realms/alpha/userinfo',
  end_session_endpoint:
    'https://am.example.com/am/oauth2/realms/root/realms/alpha/connect/endSession',
  revocation_endpoint: 'https://am.example.com/am/oauth2/realms/root/realms/alpha/token/revoke',
  jwks_uri: 'https://am.example.com/am/oauth2/realms/root/realms/alpha/connect/jwk_uri',
};

const validResponseBody = JSON.stringify(validEndpoints);

const testEnv = new Map([
  ['VITE_FR_AM_URL', 'https://am.example.com/am'],
  ['VITE_FR_AM_COOKIE_NAME', 'iPlanetDirectoryPro'],
  ['VITE_FR_REALM_PATH', 'alpha'],
  ['VITE_FR_OAUTH_PUBLIC_CLIENT', 'TestClient'],
  ['COOKIE_SECRET', 'a-very-secret-key-that-is-at-least-32-chars'],
]);

/**
 * Build a mock HttpClient whose response is controlled by the call index.
 * The mock passes the actual request into HttpClientResponse.fromWeb for proper typing.
 */
const mockHttpClient = (
  handler: (
    callIndex: number,
    request: HttpClientRequest.HttpClientRequest,
  ) => Effect.Effect<HttpClientResponse.HttpClientResponse, Error>,
) =>
  Effect.gen(function* () {
    const counter = yield* Ref.make(0);

    return HttpClient.make((request) =>
      Ref.getAndUpdate(counter, (n) => n + 1).pipe(
        Effect.flatMap((idx) => handler(idx, request)),
        Effect.mapError(
          (err) =>
            new HttpClientError.RequestError({
              request,
              reason: 'Transport',
              description: String(err),
              cause: err,
            }),
        ),
      ),
    );
  });

/** Build a Layer stack with the given mock HTTP handler */
const makeTestLayer = (
  handler: (
    callIndex: number,
    request: HttpClientRequest.HttpClientRequest,
  ) => Effect.Effect<HttpClientResponse.HttpClientResponse, Error>,
) =>
  Layer.unwrapEffect(
    mockHttpClient(handler).pipe(
      Effect.map((client) => {
        const HttpClientLive = Layer.succeed(HttpClient.HttpClient, client);
        const ConfigLive = AppConfigService.Default.pipe(
          Layer.provide(Layer.setConfigProvider(ConfigProvider.fromMap(testEnv))),
        );
        const BaseLayer = Layer.merge(ConfigLive, HttpClientLive);
        return Layer.provideMerge(OidcDiscoveryService.Default, BaseLayer);
      }),
    ),
  );

/** Create a mock 200 response with the given body */
const okResponse = (
  request: HttpClientRequest.HttpClientRequest,
  body: string,
): Effect.Effect<HttpClientResponse.HttpClientResponse> =>
  Effect.succeed(HttpClientResponse.fromWeb(request, new Response(body, { status: 200 })));

/** Create a mock network failure */
const failResponse = (
  message: string,
): Effect.Effect<HttpClientResponse.HttpClientResponse, Error> => Effect.fail(new Error(message));

/**
 * Poll discovery.isReady until it returns true.
 * Gives the background fiber time to complete — needed because the mock
 * response involves async Response.text() which requires microtask scheduling.
 */
const waitForDiscovery = (discovery: Effect.Effect.Success<typeof OidcDiscoveryService>) =>
  discovery.isReady.pipe(
    Effect.repeat({
      until: (ready: boolean) => ready,
      schedule: Schedule.spaced(Duration.millis(10)),
    }),
    Effect.timeout(Duration.seconds(5)),
    Effect.orDie,
  );

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('OidcDiscoveryService', () => {
  it('endpoints_AmReachable_ResolvesAfterDiscovery', async () => {
    const exit = await Effect.gen(function* () {
      const discovery = yield* OidcDiscoveryService;

      yield* waitForDiscovery(discovery);

      return yield* discovery.endpoints;
    }).pipe(
      Effect.provide(makeTestLayer((_idx, req) => okResponse(req, validResponseBody))),
      Effect.runPromiseExit,
    );

    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      expect(exit.value.issuer).toBe(validEndpoints.issuer);
      expect(exit.value.authorization_endpoint).toBe(validEndpoints.authorization_endpoint);
    }
  });

  it('isReady_AfterDiscovery_ReturnsTrue', async () => {
    const exit = await Effect.gen(function* () {
      const discovery = yield* OidcDiscoveryService;

      yield* waitForDiscovery(discovery);

      return yield* discovery.isReady;
    }).pipe(
      Effect.provide(makeTestLayer((_idx, req) => okResponse(req, validResponseBody))),
      Effect.runPromiseExit,
    );

    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toBe(true);
    }
  });

  it('isReady_BeforeDiscovery_ReturnsFalse', async () => {
    const exit = await Effect.gen(function* () {
      const discovery = yield* OidcDiscoveryService;

      return yield* discovery.isReady;
    }).pipe(
      Effect.provide(
        makeTestLayer(
          (): Effect.Effect<HttpClientResponse.HttpClientResponse, Error> => Effect.never,
        ),
      ),
      Effect.runPromiseExit,
    );

    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toBe(false);
    }
  });

  /**
   * AM is unreachable initially. Handler fails twice, then succeeds.
   * Uses real clock — test takes ~3s due to 1s + 2s retry delays.
   */
  it('endpoints_AmUnreachable_RetriesAndResolves', async () => {
    const handler = (callIndex: number, request: HttpClientRequest.HttpClientRequest) =>
      callIndex < 2 ? failResponse('Connection refused') : okResponse(request, validResponseBody);

    const exit = await Effect.gen(function* () {
      const discovery = yield* OidcDiscoveryService;

      yield* waitForDiscovery(discovery);

      return yield* discovery.endpoints;
    }).pipe(Effect.provide(makeTestLayer(handler)), Effect.runPromiseExit);

    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      expect(exit.value.issuer).toBe(validEndpoints.issuer);
    }
  }, 15_000);

  /**
   * AM returns a 200 but the body is missing required fields.
   * Schema validation fails → retry continues until a valid response arrives.
   */
  it('endpoints_MalformedDiscoveryDocument_RetriesUntilValid', async () => {
    const malformedBody = JSON.stringify({ issuer: 'https://am.example.com' }); // missing all other fields

    const handler = (callIndex: number, request: HttpClientRequest.HttpClientRequest) =>
      callIndex < 2
        ? okResponse(request, malformedBody) // First 2 calls return malformed
        : okResponse(request, validResponseBody); // Third call returns valid

    const exit = await Effect.gen(function* () {
      const discovery = yield* OidcDiscoveryService;

      yield* waitForDiscovery(discovery);

      return yield* discovery.endpoints;
    }).pipe(Effect.provide(makeTestLayer(handler)), Effect.runPromiseExit);

    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      expect(exit.value.issuer).toBe(validEndpoints.issuer);
      expect(exit.value.authorization_endpoint).toBe(validEndpoints.authorization_endpoint);
    }
  }, 15_000);

  /**
   * When the deferred hasn't been resolved and we call `endpoints`,
   * the 200ms timeout fires and we get ServiceUnavailable.
   * Uses TestClock to control the timeout without real waits.
   */
  it('endpoints_BeforeDiscovery_FailsWithServiceUnavailable', async () => {
    const exit = await Effect.gen(function* () {
      const discovery = yield* OidcDiscoveryService;

      const fiber = yield* Effect.fork(discovery.endpoints);

      yield* TestClock.adjust(Duration.millis(300));

      return yield* Fiber.await(fiber);
    }).pipe(
      Effect.provide(
        makeTestLayer(
          (): Effect.Effect<HttpClientResponse.HttpClientResponse, Error> => Effect.never,
        ),
      ),
      Effect.provide(TestContext.TestContext),
      Effect.runPromiseExit,
    );

    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      const innerExit = exit.value;
      expect(Exit.isFailure(innerExit)).toBe(true);
      expect(String(innerExit)).toContain('ServiceUnavailable');
    }
  });
});
