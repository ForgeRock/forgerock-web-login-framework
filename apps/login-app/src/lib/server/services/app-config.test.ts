import { describe, expect, it } from 'vitest';
import { ConfigProvider, Duration, Effect, Exit, Redacted } from 'effect';

import { AppConfigService } from './app-config';

const validEnv = new Map([
  ['VITE_FR_AM_URL', 'https://am.example.com/am'],
  ['VITE_FR_AM_COOKIE_NAME', 'iPlanetDirectoryPro'],
  ['VITE_FR_REALM_PATH', 'alpha'],
  ['VITE_FR_OAUTH_PUBLIC_CLIENT', 'TestClient'],
  ['COOKIE_SECRET', 'a-very-secret-key-that-is-at-least-32-chars'],
]);

/**
 * Resolve AppConfigService against a given env map.
 * Provides the Default layer (which reads Config → runs the `effect` property),
 * overrides the ConfigProvider to use our test map, and captures the Exit
 * so we can assert on both success and `orDie` defects.
 */
const resolveConfig = (env: Map<string, string>) =>
  AppConfigService.pipe(
    Effect.provide(AppConfigService.Default),
    Effect.withConfigProvider(ConfigProvider.fromMap(env)),
    Effect.exit,
    Effect.runPromise,
  );

describe('AppConfigService', () => {
  it('resolve_ValidEnv_Succeeds', async () => {
    const exit = await resolveConfig(validEnv);

    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      expect(exit.value.amUrl).toBe('https://am.example.com/am');
      expect(exit.value.amCookieName).toBe('iPlanetDirectoryPro');
      expect(exit.value.cookieSecrets).toHaveLength(1);
      expect(Redacted.value(exit.value.cookieSecrets[0])).toBe(
        'a-very-secret-key-that-is-at-least-32-chars',
      );
    }
  });

  it('resolve_MissingAmUrl_Dies', async () => {
    const env = new Map(validEnv);
    env.delete('VITE_FR_AM_URL');

    const exit = await resolveConfig(env);
    expect(Exit.isFailure(exit)).toBe(true);
  });

  it('resolve_MissingCookieName_Dies', async () => {
    const env = new Map(validEnv);
    env.delete('VITE_FR_AM_COOKIE_NAME');

    const exit = await resolveConfig(env);
    expect(Exit.isFailure(exit)).toBe(true);
  });

  it('resolve_MissingRealmPath_Dies', async () => {
    const env = new Map(validEnv);
    env.delete('VITE_FR_REALM_PATH');

    const exit = await resolveConfig(env);
    expect(Exit.isFailure(exit)).toBe(true);
  });

  it('resolve_MissingOauthClientId_Dies', async () => {
    const env = new Map(validEnv);
    env.delete('VITE_FR_OAUTH_PUBLIC_CLIENT');

    const exit = await resolveConfig(env);
    expect(Exit.isFailure(exit)).toBe(true);
  });

  it('resolve_ShortSecret_Dies', async () => {
    const env = new Map(validEnv);
    env.set('COOKIE_SECRET', 'too-short');

    const exit = await resolveConfig(env);
    expect(Exit.isFailure(exit)).toBe(true);
  });

  it('resolve_InvalidUrl_Dies', async () => {
    const env = new Map(validEnv);
    env.set('VITE_FR_AM_URL', 'not-a-url');

    const exit = await resolveConfig(env);
    expect(Exit.isFailure(exit)).toBe(true);
  });

  it('resolve_DefaultValues_Applied', async () => {
    const exit = await resolveConfig(validEnv);

    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      expect(exit.value.cookieTtl).toEqual(Duration.seconds(300));
      expect(exit.value.appDomain).toBe('localhost');
      expect(exit.value.appOrigin).toBe('http://localhost:5173');
      expect(exit.value.amRequestTimeout).toEqual(Duration.millis(30_000));
    }
  });

  it('resolve_CustomOptionalValues_OverrideDefaults', async () => {
    const env = new Map(validEnv);
    env.set('COOKIE_TTL_SECONDS', '600');
    env.set('APP_DOMAIN', 'example.com');
    env.set('ORIGIN', 'https://login.example.com');
    env.set('AM_REQUEST_TIMEOUT', '10000');

    const exit = await resolveConfig(env);

    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      expect(exit.value.cookieTtl).toEqual(Duration.seconds(600));
      expect(exit.value.appDomain).toBe('example.com');
      expect(exit.value.appOrigin).toBe('https://login.example.com');
      expect(exit.value.amRequestTimeout).toEqual(Duration.millis(10_000));
    }
  });

  it('resolve_InvalidCookieTtl_Dies', async () => {
    const env = new Map(validEnv);
    env.set('COOKIE_TTL_SECONDS', '0');

    const exit = await resolveConfig(env);
    expect(Exit.isFailure(exit)).toBe(true);
  });

  it('resolve_InvalidAppOrigin_Dies', async () => {
    const env = new Map(validEnv);
    env.set('ORIGIN', 'not-a-url');

    const exit = await resolveConfig(env);
    expect(Exit.isFailure(exit)).toBe(true);
  });
});
