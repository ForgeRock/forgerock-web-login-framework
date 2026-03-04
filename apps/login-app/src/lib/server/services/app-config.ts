import {
  Config,
  Duration,
  Effect,
  Match,
  Redacted,
  type Redacted as RedactedType,
  Schema,
  pipe,
} from 'effect';

/** Schema filter that validates a string is a parseable URL (Node 20+) */
export const UrlString = Schema.NonEmptyString.pipe(
  Schema.filter((s) => URL.canParse(s), { message: () => 'Must be a valid URL' }),
);

const isValidUrl = (s: string): boolean => URL.canParse(s);

/** Declarative config description — reads from process.env via the default ConfigProvider */
const appConfig = Config.all({
  amUrl: Config.string('VITE_FR_AM_URL').pipe(
    Config.validate({ message: 'Must be a valid URL', validation: isValidUrl }),
  ),
  amCookieName: Config.nonEmptyString('VITE_FR_AM_COOKIE_NAME'),
  realmPath: Config.nonEmptyString('VITE_FR_REALM_PATH'),
  oauthClientId: Config.nonEmptyString('VITE_FR_OAUTH_PUBLIC_CLIENT'),
  /**
   * AES-256-GCM key(s) for encrypting auth state cookies.
   * Supports comma-separated list for zero-downtime key rotation:
   * first key is used for encryption, all keys are tried for decryption.
   * Each key must be at least 32 characters.
   */
  cookieSecrets: Config.redacted('COOKIE_SECRET').pipe(
    Config.map((r) => {
      const raw = Redacted.value(r);
      const parts = raw.split(',').map((s) => s.trim());
      return parts.map((s) => Redacted.make(s));
    }),
    Config.validate({
      message: 'COOKIE_SECRET must contain at least one key, each at least 32 characters',
      validation: (secrets: ReadonlyArray<RedactedType.Redacted<string>>) =>
        secrets.length > 0 && secrets.every((s) => Redacted.value(s).length >= 32),
    }),
  ),
  /** Cookie Max-Age as a Duration (default: 300 seconds) */
  cookieTtl: Config.integer('COOKIE_TTL_SECONDS').pipe(
    Config.withDefault(300),
    Config.validate({
      message: 'COOKIE_TTL_SECONDS must be greater than 0',
      validation: (n) => n > 0,
    }),
    Config.map(Duration.seconds),
  ),
  appDomain: Config.string('APP_DOMAIN').pipe(Config.withDefault('localhost')),
  /**
   * Full origin URL for redirect validation (e.g., "http://localhost:5173" in dev,
   * "https://login.example.com" in production). Prevents open-redirect attacks by
   * checking AM's redirect URL against known-good origins.
   */
  appOrigin: Config.string('ORIGIN').pipe(
    Config.withDefault('http://localhost:5173'),
    Config.validate({ message: 'ORIGIN must be a valid URL', validation: isValidUrl }),
  ),
  /** Timeout for AM HTTP requests as a Duration (default: 30000 milliseconds) */
  amRequestTimeout: Config.integer('AM_REQUEST_TIMEOUT').pipe(
    Config.withDefault(30_000),
    Config.validate({
      message: 'AM_REQUEST_TIMEOUT must be greater than 0',
      validation: (n) => n > 0,
    }),
    Config.map(Duration.millis),
  ),
  /** Maximum concurrent outbound AM requests (semaphore permits). Default: 50 */
  amMaxConcurrency: Config.integer('AM_MAX_CONCURRENCY').pipe(
    Config.withDefault(50),
    Config.validate({
      message: 'AM_MAX_CONCURRENCY must be greater than 0',
      validation: (n) => n > 0,
    }),
  ),
  /** Enable in-app rate limiting for auth-sensitive endpoints. Default: true.
   * Set to false when an external rate limiter (load balancer, WAF) handles throttling. */
  rateLimitEnabled: Config.boolean('RATE_LIMIT_ENABLED').pipe(Config.withDefault(true)),
  /** Rate limit: max requests per minute per IP for auth-sensitive endpoints. Default: 60 */
  rateLimitRpm: Config.integer('RATE_LIMIT_RPM').pipe(
    Config.withDefault(60),
    Config.validate({
      message: 'RATE_LIMIT_RPM must be greater than 0',
      validation: (n) => n > 0,
    }),
  ),
  /** Rate limit: burst allowance above the steady rate. Default: 10 */
  rateLimitBurst: Config.integer('RATE_LIMIT_BURST').pipe(
    Config.withDefault(10),
    Config.validate({
      message: 'RATE_LIMIT_BURST must be greater than 0',
      validation: (n) => n > 0,
    }),
  ),
});

/** Resolved application configuration — all env vars validated and typed */
export type AppConfig = Config.Config.Success<typeof appConfig>;

/**
 * Application configuration service — reads and validates environment variables.
 *
 * Uses Effect's `Config` module: the default `ConfigProvider` reads from `process.env`.
 * Tests can override with `Layer.succeed(AppConfigService, testConfig)` or
 * swap the `ConfigProvider` via `Effect.withConfigProvider(ConfigProvider.fromMap(...))`.
 * Fails fast with `Effect.die` on invalid config (startup defect, not recoverable).
 */
export class AppConfigService extends Effect.Service<AppConfigService>()('AppConfigService', {
  effect: appConfig.pipe(
    Effect.tapError((err) =>
      Effect.logError('AppConfig validation failed').pipe(
        Effect.annotateLogs({ error: String(err) }),
      ),
    ),
    Effect.orDie,
  ),
}) {}

/** Build a realm path for a given API prefix (json, oauth2) */
const realmPath = (prefix: string, realm: string): string =>
  pipe(
    Match.value(realm),
    Match.when('root', () => `/${prefix}/realms/root`),
    Match.orElse((path) => `/${prefix}/realms/root/realms/${path}`),
  );

/** Constructs the JSON API realm path: `/json/realms/root/realms/<path>` or `/json/realms/root` */
export const jsonRealmPath = (config: AppConfig): string => realmPath('json', config.realmPath);

/** Constructs the OAuth2 realm path: `/oauth2/realms/root/realms/<path>` or `/oauth2/realms/root` */
export const oauthRealmPath = (config: AppConfig): string => realmPath('oauth2', config.realmPath);
