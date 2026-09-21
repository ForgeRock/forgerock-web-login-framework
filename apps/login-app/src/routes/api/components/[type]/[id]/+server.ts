/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect } from 'effect';

import { deleteComponent, getComponent, updateComponent } from '$lib/server/component-endpoint';

import type { RequestHandler } from './$types';

/** Retrieves a component record by type and id. */
export const GET: RequestHandler = ({ request, params }) =>
  Effect.runPromise(
    getComponent(request, params.type, params.id, { token: process.env.COMPONENT_SAVE_TOKEN }),
  );

/** Updates an existing component record. */
export const PUT: RequestHandler = ({ request, params }) =>
  Effect.runPromise(
    updateComponent(request, params.type, params.id, { token: process.env.COMPONENT_SAVE_TOKEN }),
  );

/** Deletes a component record. */
export const DELETE: RequestHandler = ({ request, params }) =>
  Effect.runPromise(
    deleteComponent(request, params.type, params.id, { token: process.env.COMPONENT_SAVE_TOKEN }),
  );
