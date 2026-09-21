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

export const POST: RequestHandler = async ({ request }) =>
  Effect.runPromise(
    publishComponentBundle(request, {
      token: process.env.COMPONENT_SAVE_TOKEN,
    }),
  );
