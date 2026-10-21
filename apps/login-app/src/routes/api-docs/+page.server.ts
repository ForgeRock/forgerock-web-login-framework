/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { Effect } from 'effect';

import { componentApiEnabled, SettingsLive } from '$lib/server/custom-components/settings';

import type { PageServerLoad } from './$types';

/**
 * Resolves Component API availability on the server so the page renders the
 * right branch from SSR — no client-side probing of /api/openapi needed.
 */
export const load: PageServerLoad = () =>
  Effect.runPromise(
    Effect.map(componentApiEnabled, (enabled) => ({ enabled })).pipe(Effect.provide(SettingsLive)),
  );
