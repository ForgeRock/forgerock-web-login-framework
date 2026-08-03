/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * Public API surface contract for configure().
 *
 * This file is the gate that would have caught the 2.0 regression: sdk.config.ts
 * was deleted and several options (middleware, logger, oauthThreshold, storage)
 * silently disappeared from the type of configure(). Any removal of a field from
 * the public type — regardless of whether it comes from deleting a schema file,
 * restructuring widget.config.ts, or changing WidgetConfigOptions — makes this
 * file fail to typecheck.
 *
 * HOW TO UPDATE: if a field is intentionally added or removed, update this file
 * in the same PR. Changing this file is a deliberate act that reviewers can see.
 */

import { expectTypeOf } from 'vitest';

import type { WidgetConfigOptions } from './widget.config';

// ---------- top-level fields ----------

expectTypeOf<WidgetConfigOptions>().toHaveProperty('wellknown');
expectTypeOf<WidgetConfigOptions['wellknown']>().toEqualTypeOf<string>();

expectTypeOf<WidgetConfigOptions>().toHaveProperty('logger');
expectTypeOf<WidgetConfigOptions>().toHaveProperty('middleware');
expectTypeOf<WidgetConfigOptions>().toHaveProperty('captcha');
expectTypeOf<WidgetConfigOptions>().toHaveProperty('oidcClient');
expectTypeOf<WidgetConfigOptions>().toHaveProperty('content');
expectTypeOf<WidgetConfigOptions>().toHaveProperty('journeys');
expectTypeOf<WidgetConfigOptions>().toHaveProperty('links');
expectTypeOf<WidgetConfigOptions>().toHaveProperty('style');

// ---------- logger ----------

type Logger = NonNullable<WidgetConfigOptions['logger']>;

expectTypeOf<Logger>().toHaveProperty('level');
expectTypeOf<Logger['level']>().toEqualTypeOf<'none' | 'error' | 'warn' | 'info' | 'debug'>();
expectTypeOf<Logger>().toHaveProperty('custom');

// ---------- middleware ----------

type Middleware = NonNullable<WidgetConfigOptions['middleware']>;
expectTypeOf<Middleware>().toEqualTypeOf<Middleware[number][]>();

// ---------- oidcClient ----------

type OidcClient = NonNullable<WidgetConfigOptions['oidcClient']>;

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
type Storage = NonNullable<OidcClient['storage']>;
expectTypeOf<Storage['type']>().toEqualTypeOf<'localStorage' | 'sessionStorage' | 'custom'>();
