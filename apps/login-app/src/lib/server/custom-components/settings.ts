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
 * Component API settings resolved through Effect `Config`.
 *
 * The provider is built from SvelteKit's `$env/dynamic/private`, the server-side
 * source every other setting in this app reads from: `.env` values in dev, and the
 * process environment in production (SvelteKit merges both into dynamic env).
 * `process.env` is merged last so shell-provided variables win. The map is built
 * when the layer builds — not at module load — so env changes between builds are
 * honored.
 */

/** Whether this deployment serves the Component API. Disabled deployments 404 every route. */
export const componentApiEnabled: Effect.Effect<boolean, ConfigError> = Config.boolean(
  'COMPONENT_API_ENABLED',
).pipe(Config.withDefault(false));

/** Absolute path of the tracked config directory the Component API reads and writes. */
export const componentConfigDir: Effect.Effect<string, ConfigError> = Config.string(
  'COMPONENT_CONFIG_DIR',
).pipe(Config.withDefault('/config/config'));

/**
 * The settings provider as a layer: `Config` reads inside effects provided with this
 * layer resolve from the SvelteKit dynamic env merged over `process.env`.
 */
export const SettingsLive: Layer.Layer<never> = Layer.unwrapEffect(
  Effect.sync(() =>
    Layer.setConfigProvider(
      ConfigProvider.fromMap(
        new Map(
          Object.entries({ ...env, ...process.env }).filter(
            (entry): entry is [string, string] => entry[1] !== undefined,
          ),
        ),
      ),
    ),
  ),
);
