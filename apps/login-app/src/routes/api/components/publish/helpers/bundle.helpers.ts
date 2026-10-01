/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Schema } from 'effect';

import { PublishResponseSchema } from '$lib/server/component-api';

import type { PublishRequestSchema } from '$lib/server/component-api';

/** Serializes a publish request into the repository bundle format. */
export const publishBundle = (body: Schema.Schema.Type<typeof PublishRequestSchema>): string =>
  JSON.stringify({ files: [...(body.files ?? []), { path: 'bundle.js', content: body.code }] });

/** Produces the fixed publish-success response after a bundle is persisted. */
export const publishResponse = (): Response =>
  Response.json(Schema.encodeSync(PublishResponseSchema)({ id: crypto.randomUUID(), url: '' }));
