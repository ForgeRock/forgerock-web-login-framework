/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect } from 'effect';

import { createComponent, listComponents } from '$lib/server/custom-components/api';
import { ComponentApiLive } from '$lib/server/custom-components/runtime';

import type { RequestHandler } from './$types';

/**
 * Lists records for a component type, optionally projecting fields from the query string.
 *
 * @param event - Request event containing the `type` path parameter and optional `fields` query parameter.
 * @returns A response with 200 records, 400 for invalid fields, 401 for an invalid Bearer token,
 * 404 for an invalid type, or 500 for storage failures.
 */
export const GET: RequestHandler = ({ request, params }) =>
  Effect.runPromise(Effect.provide(listComponents(request, params.type), ComponentApiLive));

/**
 * Creates a record for a component type.
 *
 * Requires an authenticated AM admin session (cookie or `Authorization: Bearer <AM session token>`) and `COMPONENT_API_ENABLED=true` in the deployment environment.
 *
 * @param event - Request event containing the `type` path parameter and JSON component body.
 * @returns A response with 201 for the created record; 400 for malformed input, 401 for an invalid Bearer
 * token, 404 for an invalid type, 413 for an oversized body, 415 for non-JSON, or 500 for storage failures.
 */
export const POST: RequestHandler = ({ request, params }) =>
  Effect.runPromise(Effect.provide(createComponent(request, params.type), ComponentApiLive));
