/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect } from 'effect';

import { publishComponent } from '$lib/server/custom-components/api/api';
import { ComponentApiLive } from '$lib/server/custom-components/runtime';

import type { RequestHandler } from './$types';

/**
 * Publishes a component source bundle to the repository.
 *
 * Requires an authenticated AM admin session (cookie or `Authorization: Bearer <AM session token>`) and `COMPONENT_API_ENABLED=true` in the deployment environment.
 *
 * @param event - Request event containing the JSON code bundle.
 * @returns A response with 204 and no body — the bundle is persisted to the component repository and served through the separate publish channel; 400 for malformed input, 401 for an invalid Bearer token, 413 for an oversized body, 415 for non-JSON, or 500 for a
 * repository failure.
 */
export const POST: RequestHandler = ({ request }) =>
  Effect.runPromise(Effect.provide(publishComponent(request), ComponentApiLive));
