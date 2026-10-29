/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

/**
 * Editor write commands (kit RPC). Each runs the Component API handler in-process
 * and delivers handler failures to the browser as kit HttpErrors (401/403/…), so
 * the pages try/catch instead of unwrapping result values. Reads go through the
 * routes' +page.server.ts loads, not through here.
 */

import { error } from '@sveltejs/kit';
import { Effect, Schema } from 'effect';

import { command, getRequestEvent } from '$app/server';
import {
  createComponent,
  deleteComponent,
  publishComponent,
  updateComponent,
} from '$lib/server/custom-components/api/api';
import { ComponentRecordSchema } from '$lib/server/custom-components/api/api.schemas';
import { ComponentApiLive } from '$lib/server/custom-components/runtime';

import type { ComponentMetaSchema } from '$lib/server/custom-components/api/api.schemas';
import type { AuthService } from '$lib/server/custom-components/auth/auth';
import type { ComponentLogger } from '$lib/server/custom-components/log';
import type { PublishService } from '$lib/server/custom-components/publish/publish';
import type { ComponentStoreApi } from '$lib/server/custom-components/store/store';

/** The editor's record type — the API's own schema shape, not a hand copy. */
export type ComponentRecord = typeof ComponentRecordSchema.Type;

/** Client-editable metadata; the server owns id and dates. */
export type ClientComponentMeta = typeof ComponentMetaSchema.Type;

/** The services a Component API handler can require; ComponentApiLive provides them. */
type HandlerServices = ComponentStoreApi | AuthService | PublishService | ComponentLogger;

/**
 * Runs one handler with the real graph and decodes its response through `schema`.
 *
 *   handler = <200 '{"id":…}'>  →  returns the validated record
 *   handler = <404 'Not found'>  →  throws error(404, 'Not found')
 */
const run = async <A, I>(
  handler: Effect.Effect<Response, never, HandlerServices>,
  schema: Schema.Schema<A, I>,
): Promise<A> => {
  const response = await Effect.runPromise(Effect.provide(handler, ComponentApiLive));
  const text = await response.text();
  if (!response.ok) {
    error(response.status, text || 'Component API request failed');
  }
  try {
    return Schema.decodeUnknownSync(schema)(text === '' ? null : JSON.parse(text));
  } catch {
    error(500, 'Unexpected response from the Component API');
  }
};

/**
 * Rebuilds the handler request for a command. Kit consumes the command's own body
 * (its { payload, refreshes } envelope), so the handler's JSON body is rebuilt from
 * the parsed argument while the browser's auth headers ride along. Content-Length
 * is dropped because it described kit's envelope, not this body.
 */
const handlerRequest = (method: 'POST' | 'PUT' | 'DELETE', body?: unknown): Request => {
  const event = getRequestEvent();
  const headers = new Headers(event.request.headers);
  headers.delete('content-length');
  return new Request(event.url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
};

/** Creates a record; returns the created record with server-owned id and dates. */
export const createRecord = command(
  'unchecked',
  async (input: { type: string; src: string; meta: ClientComponentMeta }) =>
    run(
      createComponent(handlerRequest('POST', { src: input.src, meta: input.meta }), input.type),
      ComponentRecordSchema,
    ),
);

/** Updates the record (server-owned dates are rejected by the API and stripped here). */
export const updateRecord = command(
  'unchecked',
  async (input: { type: string; id: string; src: string; meta: ComponentRecord['meta'] }) => {
    const { createdDate: _createdDate, modifiedDate: _modifiedDate, ...clientMeta } = input.meta;
    return run(
      updateComponent(
        handlerRequest('PUT', { src: input.src, meta: clientMeta }),
        input.type,
        input.id,
      ),
      ComponentRecordSchema,
    );
  },
);

/** Deletes a record. */
export const deleteRecord = command('unchecked', async (input: { type: string; id: string }) =>
  run(deleteComponent(handlerRequest('DELETE'), input.type, input.id), Schema.Null),
);

/** Publishes one global bundle of component source code. */
export const publishBundle = command('unchecked', async (code: string) =>
  run(publishComponent(handlerRequest('POST', { code })), Schema.Null),
);
