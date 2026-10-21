/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Config, ConfigProvider, Effect, Layer } from 'effect';

import { env } from '$env/dynamic/private';

import type { ConfigError } from 'effect/ConfigError';

/**
 * Component API settings from env vars.
 *
 * SettingsLive feeds Config reads from SvelteKit dynamic env plus process.env
 * (shell wins). Built when the layer builds, so env changes between builds are
 * picked up. Empty-string values are dropped before Config sees them, so an
 * empty env var behaves as unset and `withDefault` applies.
 */

/** Whether this deployment serves the Component API. Disabled deployments 404 every route. */
export const componentApiEnabled: Effect.Effect<boolean, ConfigError> = Config.boolean(
  'COMPONENT_API_ENABLED',
).pipe(Config.withDefault(false));

/** Absolute path of the git-tracked config directory the Component API reads and writes. */
export const componentConfigDir: Effect.Effect<string> = Config.string('COMPONENT_CONFIG_DIR').pipe(
  Config.withDefault('/config/config'),
  // A defaulted string config cannot fail; orElseSucceed discharges the conservative error type.
  Effect.orElseSucceed(() => '/config/config'),
);

/** Provides env vars to Config reads; see the file comment. */
export const SettingsLive: Layer.Layer<never> = Layer.suspend(() =>
  Layer.setConfigProvider(
    ConfigProvider.fromMap(
      new Map(
        Object.entries({ ...env, ...process.env }).filter(
          (entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== '',
        ),
      ),
    ),
  ),
);
