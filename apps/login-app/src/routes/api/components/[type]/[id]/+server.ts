/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect } from 'effect';

import { deleteComponent, getComponent, updateComponent } from '$lib/server/component-endpoint';
import { ComponentApiRuntime } from '$lib/server/runtime';

import type { RequestHandler } from './$types';

/**
 * Retrieves a component record by type and ID.
 *
 * @category routes
 */
export const GET: RequestHandler = ({ request, params }) =>
  Effect.runPromise(
    Effect.provide(
      getComponent(request, params.type, params.id, process.env.COMPONENT_SAVE_TOKEN),
      ComponentApiRuntime,
    ),
  );

/**
 * Replaces an existing component record by type and ID.
 *
 * **Gotchas**
 *
 * When `COMPONENT_SAVE_TOKEN` is configured, the request must include a matching
 * `Authorization: Bearer` credential. A supplied body ID must match the route ID.
 *
 * @category routes
 */
export const PUT: RequestHandler = ({ request, params }) =>
  Effect.runPromise(
    Effect.provide(
      updateComponent(request, params.type, params.id, process.env.COMPONENT_SAVE_TOKEN),
      ComponentApiRuntime,
    ),
  );

/**
 * Deletes a component record by type and ID.
 *
 * **Gotchas**
 *
 * When `COMPONENT_SAVE_TOKEN` is configured, the request must include a matching
 * `Authorization: Bearer` credential.
 *
 * @category routes
 */
export const DELETE: RequestHandler = ({ request, params }) =>
  Effect.runPromise(
    Effect.provide(
      deleteComponent(request, params.type, params.id, process.env.COMPONENT_SAVE_TOKEN),
      ComponentApiRuntime,
    ),
  );
