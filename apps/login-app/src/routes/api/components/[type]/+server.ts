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

/** Lists component records for a type. */
export const GET: RequestHandler = ({ request, params }) =>
  Effect.runPromise(
    listComponents(request, params.type, { token: process.env.COMPONENT_SAVE_TOKEN }),
  );

/** Creates a component record for a type. */
export const POST: RequestHandler = ({ request, params }) =>
  Effect.runPromise(
    createComponent(request, params.type, { token: process.env.COMPONENT_SAVE_TOKEN }),
  );
