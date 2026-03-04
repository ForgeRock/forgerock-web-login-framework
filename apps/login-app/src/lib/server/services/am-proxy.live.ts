import { Headers, HttpClient, HttpClientRequest, HttpClientResponse } from '@effect/platform';
import { Effect, Layer, Option, Schedule } from 'effect';

import { AmError, AmUnreachable } from '$server/errors';

import { AmProxyService } from './am-proxy';
import { AppConfigService, jsonRealmPath } from './app-config';
import { type OidcEndpoints, OidcDiscoveryService, stripBase } from './oidc-discovery';

/**
 * Retry policy for transient network failures reaching AM.
 * 3 total attempts with exponential backoff: ~100ms, ~200ms, jittered.
 */
const amRetryPolicy = Schedule.intersect(
  Schedule.exponential('100 millis'),
  Schedule.recurs(2),
).pipe(Schedule.jittered);

const amRetryWithLogging = (url: string) =>
  amRetryPolicy.pipe(
    Schedule.tapInput((err: AmUnreachable) =>
      Effect.logWarning('AM request failed, retrying').pipe(
        Effect.annotateLogs({ url, cause: String(err.cause) }),
      ),
    ),
  );

/**
 * Whether an AmUnreachable represents a connection-level failure where the
 * request definitely did not reach AM. Timeouts are excluded — the request
 * may have been processed but we didn't get the response in time.
 */
const isConnectionError = (err: AmUnreachable): boolean => err.kind === 'connection';

/**
 * Retry policy that only retries on connection-level failures (request never
 * reached AM). Safe for non-idempotent endpoints like /authenticate where a
 * timeout doesn't guarantee the request wasn't processed.
 */
const connectionOnlyRetry = (url: string) =>
  amRetryPolicy.pipe(
    Schedule.whileInput((err: AmUnreachable) => isConnectionError(err)),
    Schedule.tapInput((err: AmUnreachable) =>
      Effect.logWarning('AM request failed (connection), retrying').pipe(
        Effect.annotateLogs({ url, cause: String(err.cause) }),
      ),
    ),
  );

/** Append a query string to a path, omitting the `?` when empty. */
const appendQuery = (path: string, queryString: string): string =>
  queryString ? `${path}?${queryString}` : path;

/** Build a conditional cookie header — empty object when no cookie is present. */
const cookieHeader = (cookie: string): Record<string, string> => (cookie ? { cookie } : {});

const toAmResponse = (response: HttpClientResponse.HttpClientResponse) =>
  response.text.pipe(
    Effect.map((body) => ({
      status: response.status,
      body,
      headers: response.headers,
    })),
    Effect.catchTags({
      ResponseError: (cause) => Effect.fail(new AmUnreachable({ cause, kind: 'connection' })),
    }),
  );

export const AmProxyLive: Layer.Layer<
  AmProxyService,
  never,
  AppConfigService | HttpClient.HttpClient | OidcDiscoveryService
> = Layer.effect(
  AmProxyService,
  Effect.gen(function* () {
    const config = yield* AppConfigService;
    const baseClient = yield* HttpClient.HttpClient;
    const discovery = yield* OidcDiscoveryService;
    const jsonPath = jsonRealmPath(config);

    /** Resolve an OIDC endpoint path at request time (fails with ServiceUnavailable pre-discovery) */
    const endpointPath = (pick: (ep: OidcEndpoints) => string) =>
      discovery.endpoints.pipe(Effect.map((ep) => stripBase(pick(ep), config.amUrl)));

    const amSemaphore = yield* Effect.makeSemaphore(config.amMaxConcurrency);

    const amClient = baseClient.pipe(
      HttpClient.mapRequest(HttpClientRequest.prependUrl(config.amUrl)),
      HttpClient.catchTags({
        RequestError: (err) => Effect.fail(new AmUnreachable({ cause: err, kind: 'connection' })),
        ResponseError: (err) => Effect.fail(new AmUnreachable({ cause: err, kind: 'connection' })),
      }),
    );

    /** Execute an AM request with concurrency-limiting semaphore and timeout. */
    const executeWithTimeout = (request: HttpClientRequest.HttpClientRequest) =>
      amSemaphore.withPermits(1)(
        amClient.execute(request).pipe(
          Effect.timeoutFail({
            duration: config.amRequestTimeout,
            onTimeout: () =>
              new AmUnreachable({ cause: new Error('AM request timeout'), kind: 'timeout' }),
          }),
        ),
      );

    /** Execute with timeout, retry on failure, then parse the AM response body. */
    const executeAndRetry = (request: HttpClientRequest.HttpClientRequest) =>
      executeWithTimeout(request).pipe(
        Effect.retry(amRetryWithLogging(request.url)),
        Effect.flatMap(toAmResponse),
      );

    /** Execute, retry, parse, then reject non-2xx responses as `AmError`. */
    const amFetch = (request: HttpClientRequest.HttpClientRequest) =>
      executeAndRetry(request).pipe(
        Effect.filterOrFail(
          (r) => r.status >= 200 && r.status < 300,
          (r) => new AmError({ status: r.status, body: r.body }),
        ),
      );

    return AmProxyService.of({
      /**
       * Submit an authentication step to AM's /authenticate endpoint.
       *
       * Unlike other proxy methods that use `amFetch` (which rejects non-2xx as `AmError`),
       * `authenticate` returns the raw response because AM returns both intermediate
       * callbacks (200) and auth errors (401) — the caller inspects the status.
       *
       * Uses `connectionOnlyRetry` — only retries connection-level failures where
       * the request definitely did not reach AM. Timeouts are NOT retried because
       * AM may have processed the request (credential submission is non-idempotent).
       */
      authenticate: Effect.fn('amProxy.authenticate')(function* ({
        body,
        cookie,
        queryString,
      }: {
        readonly body: string;
        readonly cookie: string;
        readonly queryString: string;
      }) {
        const path = appendQuery(`${jsonPath}/authenticate`, queryString);
        yield* Effect.annotateCurrentSpan('am.url', path);

        const request = HttpClientRequest.post(path).pipe(
          HttpClientRequest.setHeaders({
            accept: 'application/json',
            'accept-api-version': 'protocol=1.0,resource=2.1',
            'content-type': 'application/json',
            ...cookieHeader(cookie),
          }),
          HttpClientRequest.bodyText(body, 'application/json'),
        );

        return yield* executeWithTimeout(request).pipe(
          Effect.retry(connectionOnlyRetry(path)),
          Effect.flatMap(toAmResponse),
        );
      }),

      /**
       * Authorize uses executeWithTimeout + retry directly (not executeAndRetry) because
       * it needs the raw HttpClientResponse to inspect the Location header before reading
       * the body. executeAndRetry calls toAmResponse which reads the body eagerly.
       */
      authorize: Effect.fn('amProxy.authorize')(function* ({
        cookie,
        queryString,
      }: {
        readonly cookie: string;
        readonly queryString: string;
      }) {
        const authzPath = yield* endpointPath((ep) => ep.authorization_endpoint);
        const path = `${authzPath}?${queryString}`;
        yield* Effect.annotateCurrentSpan('am.url', path);

        const response = yield* executeWithTimeout(
          HttpClientRequest.get(path).pipe(HttpClientRequest.setHeaders(cookieHeader(cookie))),
        ).pipe(Effect.retry(amRetryWithLogging(path)));

        const location = Headers.get(response.headers, 'location');
        if (Option.isSome(location)) {
          return { redirectUrl: location.value };
        }

        const amResponse = yield* toAmResponse(response);
        return yield* Effect.fail(
          new AmError({
            status: amResponse.status,
            body: amResponse.body || JSON.stringify({ error: 'Missing redirect location from AM' }),
          }),
        );
      }),

      /**
       * Exchange an authorization code for tokens. No retry — the auth code is
       * single-use, so retrying after a timeout could submit a replayed code.
       */
      getTokens: ({ body }) =>
        endpointPath((ep) => ep.token_endpoint).pipe(
          Effect.flatMap((path) =>
            executeWithTimeout(
              HttpClientRequest.post(path).pipe(
                HttpClientRequest.bodyText(body, 'application/x-www-form-urlencoded'),
              ),
            ).pipe(
              Effect.flatMap(toAmResponse),
              Effect.filterOrFail(
                (r) => r.status >= 200 && r.status < 300,
                (r) => new AmError({ status: r.status, body: r.body }),
              ),
            ),
          ),
        ),

      getUserInfo: ({ authorization }) =>
        endpointPath((ep) => ep.userinfo_endpoint).pipe(
          Effect.flatMap((path) =>
            amFetch(
              HttpClientRequest.get(path).pipe(
                HttpClientRequest.setHeader('authorization', authorization),
              ),
            ),
          ),
        ),

      revokeTokens: ({ body }) =>
        endpointPath((ep) => ep.revocation_endpoint).pipe(
          Effect.flatMap((path) =>
            amFetch(
              HttpClientRequest.post(path).pipe(
                HttpClientRequest.bodyText(body, 'application/x-www-form-urlencoded'),
              ),
            ),
          ),
        ),

      endSession: ({ authorization, queryString }) =>
        endpointPath((ep) => ep.end_session_endpoint).pipe(
          Effect.flatMap((path) =>
            amFetch(
              HttpClientRequest.get(appendQuery(path, queryString)).pipe(
                HttpClientRequest.setHeader('authorization', authorization),
              ),
            ),
          ),
        ),

      /**
       * Logout uses `connectionOnlyRetry` — session deletion is non-idempotent.
       * A timeout doesn't guarantee the request wasn't processed, so only
       * connection-level failures (request never reached AM) are retried.
       */
      logout: ({ cookie, queryString }) => {
        const path = appendQuery(`${jsonPath}/sessions/`, queryString);
        const request = HttpClientRequest.post(path).pipe(
          HttpClientRequest.setHeaders(cookieHeader(cookie)),
        );
        return executeWithTimeout(request).pipe(
          Effect.retry(connectionOnlyRetry(path)),
          Effect.flatMap(toAmResponse),
          Effect.filterOrFail(
            (r) => r.status >= 200 && r.status < 300,
            (r) => new AmError({ status: r.status, body: r.body }),
          ),
        );
      },
    });
  }),
);
