/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

/**
 * Gate for the /editor subtree: every editor page load runs the Component API's own
 * guard (enablement + AM admin session) before rendering. The handlers re-run the
 * same guard per call; this protects the page shell between handler calls.
 */

import { error } from '@sveltejs/kit';
import { Effect } from 'effect';
import { isLeft } from 'effect/Either';

import { guardRequest } from '$lib/server/custom-components/api/api.effects';
import { ComponentApiLive } from '$lib/server/custom-components/runtime';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ request }) => {
  const outcome = await Effect.runPromise(
    Effect.either(Effect.provide(guardRequest(request), ComponentApiLive)),
  );
  if (isLeft(outcome)) {
    error(outcome.left.status, outcome.left.message);
  }
  return {};
};
