/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { Effect } from 'effect';

import { publishComponentBundle } from '$lib/server/save-endpoint';

import type { RequestHandler } from './$types';

/**
 * Publishes a component bundle supplied as `{"files":[{"path","content"}]}`.
 *
 * @param event - SvelteKit request event containing the component bundle request.
 * @returns `204` on success; `400`, `401`, `413`, `415`, or `500` with an error body on failure.
 *
 * `Effect.runPromise` is the sole system edge that executes the endpoint program.
 */
export const POST: RequestHandler = async ({ request }) =>
  Effect.runPromise(
    publishComponentBundle(request, {
      token: process.env.COMPONENT_SAVE_TOKEN,
    }),
  );
