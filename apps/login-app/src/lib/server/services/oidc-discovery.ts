import { HttpClient, HttpClientRequest } from '@effect/platform';
import { Deferred, Duration, Effect, Schedule, Schema, pipe } from 'effect';

import { AmUnreachable, ServiceUnavailable } from '$server/errors';

import { AppConfigService, UrlString, oauthRealmPath } from './app-config';

/**
 * Schema for the OIDC Discovery document (RFC 8414).
 * Only validates the fields the BFF actually consumes.
 */
export const OidcEndpointsSchema = Schema.Struct({
  issuer: Schema.String,
  authorization_endpoint: UrlString,
  token_endpoint: UrlString,
  userinfo_endpoint: UrlString,
  end_session_endpoint: UrlString,
  revocation_endpoint: UrlString,
  jwks_uri: UrlString,
}).annotations({ identifier: 'OidcEndpoints' });

export type OidcEndpoints = Schema.Schema.Type<typeof OidcEndpointsSchema>;

/** Service interface — provides lazy access to OIDC endpoints with readiness checks */
interface OidcDiscoveryShape {
  /** Resolves once discovery completes. Fails with ServiceUnavailable if not yet ready. */
  readonly endpoints: Effect.Effect<OidcEndpoints, ServiceUnavailable>;
  /** Non-blocking check: true once discovery has completed successfully */
  readonly isReady: Effect.Effect<boolean>;
}

/**
 * Retry schedule for OIDC discovery: exponential backoff from 1s to 30s, infinite retries.
 * The fiber runs until discovery succeeds or the runtime disposes.
 *
 * Schema errors (AM responded but the document is malformed) are logged at ERROR
 * level since they indicate a configuration issue, while connection/timeout errors
 * are logged at WARNING since they're expected to be transient.
 */
const discoveryRetrySchedule = Schedule.exponential('1 second').pipe(
  Schedule.either(Schedule.spaced('30 seconds')),
  Schedule.tapInput((err: AmUnreachable) =>
    (err.kind === 'schema' ? Effect.logError : Effect.logWarning)(
      'OIDC discovery failed, retrying',
    ).pipe(Effect.annotateLogs({ cause: String(err.cause), kind: err.kind })),
  ),
);

/**
 * Fetch and validate the OIDC discovery document from AM.
 * Returns validated OidcEndpoints or fails with AmUnreachable.
 */
const fetchDiscoveryDocument = (
  url: string,
  client: HttpClient.HttpClient,
): Effect.Effect<OidcEndpoints, AmUnreachable> =>
  pipe(
    HttpClientRequest.get(url),
    client.execute,
    Effect.flatMap((response) => response.text),
    Effect.flatMap(Schema.decodeUnknown(Schema.parseJson(OidcEndpointsSchema))),
    Effect.tapError((parseError) =>
      Effect.logError('OIDC discovery response failed schema validation').pipe(
        Effect.annotateLogs({ url, parseError: String(parseError) }),
      ),
    ),
    Effect.catchTags({
      RequestError: (err) => Effect.fail(new AmUnreachable({ cause: err, kind: 'connection' })),
      ResponseError: (err) => Effect.fail(new AmUnreachable({ cause: err, kind: 'connection' })),
      ParseError: (err) => Effect.fail(new AmUnreachable({ cause: err, kind: 'schema' })),
    }),
  );

/**
 * OIDC Discovery service — fetches and validates the well-known configuration
 * document from ForgeRock AM via a background retry fiber.
 *
 * The server starts immediately. Discovery retries with exponential backoff
 * in the background. Requests arriving before discovery completes receive
 * a ServiceUnavailable error (503). The fiber is `forkScoped` — it is
 * automatically interrupted when the ManagedRuntime disposes.
 */
export class OidcDiscoveryService extends Effect.Service<OidcDiscoveryService>()(
  'OidcDiscoveryService',
  {
    scoped: Effect.gen(function* () {
      const config = yield* AppConfigService;
      const client = yield* HttpClient.HttpClient;
      const oauthPath = oauthRealmPath(config);
      const url = `${config.amUrl}${oauthPath}/.well-known/openid-configuration`;

      const deferred = yield* Deferred.make<OidcEndpoints>();

      yield* Effect.logInfo('Starting OIDC discovery (background)').pipe(
        Effect.annotateLogs({ url }),
      );

      // Background fiber: retry until discovery succeeds, then resolve the deferred
      const discoveryFiber = pipe(
        fetchDiscoveryDocument(url, client),
        Effect.retry(discoveryRetrySchedule),
        Effect.tap((endpoints) =>
          Effect.logInfo('OIDC discovery complete').pipe(
            Effect.annotateLogs({ issuer: endpoints.issuer }),
          ),
        ),
        Effect.tap((endpoints) => Deferred.succeed(deferred, endpoints)),
      );

      yield* Effect.forkScoped(discoveryFiber);

      return {
        endpoints: Deferred.await(deferred).pipe(
          Effect.timeoutFail({
            duration: Duration.millis(200),
            onTimeout: () =>
              new ServiceUnavailable({
                message: 'OIDC discovery in progress — server is starting up',
              }),
          }),
        ),
        isReady: Deferred.isDone(deferred),
      } satisfies OidcDiscoveryShape;
    }),
    dependencies: [AppConfigService.Default],
  },
) {}

/**
 * Extract the path portion from an absolute endpoint URL, stripping the AM base URL.
 *
 * Safe to call inside Effect generators — never throws. All inputs are validated
 * `UrlString` values from OIDC discovery, so `URL.canParse()` should always pass.
 * Falls back to the original string if parsing somehow fails.
 */
export const stripBase = (endpoint: string, baseUrl: string): string => {
  if (endpoint.startsWith(baseUrl)) {
    return endpoint.slice(baseUrl.length);
  }
  return URL.canParse(endpoint) ? new URL(endpoint).pathname : endpoint;
};
