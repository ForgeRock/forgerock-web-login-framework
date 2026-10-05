/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect } from 'effect';

import { publishComponentSource } from '$lib/server/component-endpoint';
import { ComponentApiRuntime } from '$lib/server/runtime';

import type { RequestHandler } from './$types';

/**
 * Publishes a component source bundle to the configured repository.
 *
 * **Gotchas**
 *
 * When `COMPONENT_SAVE_TOKEN` is configured, the request must include a matching
 * `Authorization: Bearer` credential.
 *
 * @category routes
 */
export const POST: RequestHandler = ({ request }) =>
  Effect.runPromise(
    Effect.provide(
      publishComponentSource(request, process.env.COMPONENT_SAVE_TOKEN),
      ComponentApiRuntime,
    ),
  );
