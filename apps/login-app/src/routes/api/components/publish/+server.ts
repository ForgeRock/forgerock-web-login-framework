/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { publishComponentSource } from '$lib/server/custom-components/api';
import { componentApiDependencies } from '$lib/server/custom-components/runtime';

import type { RequestHandler } from './$types';

/**
 * Publishes a component source bundle to the repository.
 *
 * Requires an authenticated AM admin session (cookie or `Authorization: Bearer <AM session token>`) and `COMPONENT_API_ENABLED=true` in the deployment environment.
 *
 * @param event - Request event containing the JSON code bundle and optional files.
 * @returns A response with 200 and the published bundle reference; 400 for malformed input or a rejected
 * bundle, 401 for an invalid Bearer token, 413 for an oversized body, 415 for non-JSON, or 500 for a
 * repository failure.
 */
export const POST: RequestHandler = ({ request }) =>
  publishComponentSource(request, componentApiDependencies());
