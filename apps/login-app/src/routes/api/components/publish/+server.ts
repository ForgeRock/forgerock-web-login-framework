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

import type { RequestHandler } from './$types';

/** Publishes a component bundle to the repository. */
export const POST: RequestHandler = ({ request }) =>
  Effect.runPromise(publishComponentSource(request, { token: process.env.COMPONENT_SAVE_TOKEN }));
