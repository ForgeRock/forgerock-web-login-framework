/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect } from 'effect';

import { deleteComponent, getComponent, updateComponent } from '$lib/server/custom-components/api';
import { ComponentApiRuntime } from '$lib/server/custom-components/runtime';

import type { RequestHandler } from './$types';

/**
 * Retrieves a component record by type and id.
 *
 * @param event - Request event containing `type` and UUID `id` path parameters.
 * @returns A response with 200 for the record, 400 for an invalid id, 401 for an invalid Bearer token,
 * 404 for an invalid type or missing record, or 500 for storage failures.
 */
export const GET: RequestHandler = ({ request, params }) =>
  Effect.runPromise(
    Effect.provide(getComponent(request, params.type, params.id), ComponentApiRuntime),
  );

/**
 * Updates an existing component record by type and id.
 *
 * Requires an authenticated AM admin session (cookie or `Authorization: Bearer <AM session token>`) and `COMPONENT_API_ENABLED=true` in the deployment environment.
 *
 * @param event - Request event containing `type` and UUID `id` path parameters plus a JSON component body.
 * @returns A response with 200 for the updated record; 400 for malformed input or mismatched id, 401 for
 * an invalid Bearer token, 404 for an invalid type or missing record, 413 for an oversized body, 415 for
 * non-JSON, or 500 for storage failures.
 */
export const PUT: RequestHandler = ({ request, params }) =>
  Effect.runPromise(
    Effect.provide(updateComponent(request, params.type, params.id), ComponentApiRuntime),
  );

/**
 * Deletes a component record by type and id.
 *
 * Requires an authenticated AM admin session (cookie or `Authorization: Bearer <AM session token>`) and `COMPONENT_API_ENABLED=true` in the deployment environment.
 *
 * @param event - Request event containing `type` and UUID `id` path parameters.
 * @returns A response with 204 and no body, 400 for an invalid id, 401 for an invalid Bearer token,
 * 404 for an invalid type or missing record, or 500 for storage failures.
 */
export const DELETE: RequestHandler = ({ request, params }) =>
  Effect.runPromise(
    Effect.provide(deleteComponent(request, params.type, params.id), ComponentApiRuntime),
  );
