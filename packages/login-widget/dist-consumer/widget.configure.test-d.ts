/**
 * Layer 2 API surface contract — tests the distributed types in dist/, not source.
 *
 * Layer 1 (widget.api.test-d.ts + check:api-surface) tests source via path aliases.
 * This file tests what a real consumer of the published package would see: types
 * resolved from dist/index.d.ts through the full build + processTypes pipeline.
 *
 * Failure modes Layer 1 misses that this catches:
 *   - build:types (svelte-package) not emitting a declaration file
 *   - copyTypes.mjs not copying a required .d.ts into dist/
 *   - processTypes.mjs rewriting an alias path incorrectly
 *   - dist/core/ missing a referenced type file
 *
 * Run after build:release via: pnpm run check:dist-api-surface
 * This should run in CI as a pre-release gate, not on every PR.
 */

import { expectTypeOf } from 'vitest';

// Import from dist/ directly — no path aliases, no source resolution.
// If any of these fail, the build pipeline dropped something.
import type { configure } from '../dist/index';

type ConfigureOptions = Parameters<typeof configure>[0];
type OidcClient = NonNullable<ConfigureOptions['oidcClient']>;
type Logger = NonNullable<ConfigureOptions['logger']>;
type Storage = NonNullable<OidcClient['storage']>;

// ---------- top-level ----------

expectTypeOf<ConfigureOptions>().toHaveProperty('wellknown');
expectTypeOf<ConfigureOptions['wellknown']>().toEqualTypeOf<string>();

expectTypeOf<ConfigureOptions>().toHaveProperty('logger');
expectTypeOf<ConfigureOptions>().toHaveProperty('middleware');
expectTypeOf<ConfigureOptions>().toHaveProperty('captcha');
expectTypeOf<ConfigureOptions>().toHaveProperty('oidcClient');
expectTypeOf<ConfigureOptions>().toHaveProperty('content');
expectTypeOf<ConfigureOptions>().toHaveProperty('journeys');
expectTypeOf<ConfigureOptions>().toHaveProperty('links');
expectTypeOf<ConfigureOptions>().toHaveProperty('style');

// ---------- logger ----------

expectTypeOf<Logger>().toHaveProperty('level');
expectTypeOf<Logger['level']>().toEqualTypeOf<'none' | 'error' | 'warn' | 'info' | 'debug'>();
expectTypeOf<Logger>().toHaveProperty('custom');

// ---------- oidcClient ----------

expectTypeOf<OidcClient>().toHaveProperty('clientId');
expectTypeOf<OidcClient['clientId']>().toEqualTypeOf<string>();
expectTypeOf<OidcClient>().toHaveProperty('redirectUri');
expectTypeOf<OidcClient['redirectUri']>().toEqualTypeOf<string>();
expectTypeOf<OidcClient>().toHaveProperty('scope');
expectTypeOf<OidcClient>().toHaveProperty('oauthThreshold');
expectTypeOf<OidcClient>().toHaveProperty('par');
expectTypeOf<OidcClient>().toHaveProperty('signOutRedirectUri');
expectTypeOf<OidcClient>().toHaveProperty('loginHint');
expectTypeOf<OidcClient>().toHaveProperty('acrValues');
expectTypeOf<OidcClient>().toHaveProperty('query');
expectTypeOf<OidcClient>().toHaveProperty('storage');

// storage discriminated union — all three type values must be present
expectTypeOf<Storage['type']>().toEqualTypeOf<'localStorage' | 'sessionStorage' | 'custom'>();
