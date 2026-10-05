/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect } from 'effect';

import { createComponent, listComponents } from '$lib/server/component-endpoint';
import { ComponentApiRuntime } from '$lib/server/runtime';

import type { RequestHandler } from './$types';

/**
 * Lists component records, optionally projecting fields from the query string.
 *
 * **When to use**
 *
 * Use the `fields` parameter to request top-level or dot-notation nested properties.
 *
 * @category routes
 */
export const GET: RequestHandler = ({ request, params }) =>
  Effect.runPromise(
    Effect.provide(
      listComponents(request, params.type, process.env.COMPONENT_SAVE_TOKEN),
      ComponentApiRuntime,
    ),
  );

/**
 * Creates a component record for the requested type.
 *
 * **Gotchas**
 *
 * When `COMPONENT_SAVE_TOKEN` is configured, the request must include a matching
 * `Authorization: Bearer` credential.
 *
 * @category routes
 */
export const POST: RequestHandler = ({ request, params }) =>
  Effect.runPromise(
    Effect.provide(
      createComponent(request, params.type, process.env.COMPONENT_SAVE_TOKEN),
      ComponentApiRuntime,
    ),
  );
