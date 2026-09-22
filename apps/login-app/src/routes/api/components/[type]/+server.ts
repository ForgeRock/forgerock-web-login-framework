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

import type { RequestHandler } from './$types';

/**
 * Lists records for a component type, optionally projecting fields from the query string.
 *
 * @param event - Request event containing the `type` path parameter and optional `fields` query parameter.
 * @returns A response with 200 records, 400 for invalid fields, 401 for an invalid Bearer token,
 * 404 for an invalid type, or 409/500 for storage failures.
 */
export const GET: RequestHandler = ({ request, params }) =>
  Effect.runPromise(
    listComponents(request, params.type, { token: process.env.COMPONENT_SAVE_TOKEN }),
  );

/**
 * Creates a record for a component type.
 *
 * Requires `Authorization: Bearer <COMPONENT_SAVE_TOKEN>` when the environment variable is configured.
 *
 * @param event - Request event containing the `type` path parameter and JSON component body.
 * @returns A response with 201 for the created record; 400 for malformed input, 401 for an invalid Bearer
 * token, 404 for an invalid type, 413 for an oversized body, 415 for non-JSON, or 409/500 for storage failures.
 */
export const POST: RequestHandler = ({ request, params }) =>
  Effect.runPromise(
    createComponent(request, params.type, { token: process.env.COMPONENT_SAVE_TOKEN }),
  );
