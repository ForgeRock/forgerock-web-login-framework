/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { Effect } from 'effect';

import { openApiSpec } from '$lib/server/custom-components/openapi';
import { componentApiEnabled, SettingsLive } from '$lib/server/custom-components/settings';

import type { RequestHandler } from './$types';

/**
 * Serves the OpenAPI document wherever the Component API is enabled.
 *
 * @returns The OpenAPI specification with 200 when the Component API is enabled, or 404 otherwise.
 */
export const GET: RequestHandler = () =>
  Effect.runPromise(
    Effect.map(componentApiEnabled, (enabled) =>
      enabled ? Response.json(openApiSpec) : new Response('Not Found', { status: 404 }),
    ).pipe(Effect.provide(SettingsLive)),
  );
