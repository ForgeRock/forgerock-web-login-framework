/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Data, DateTime, Option, Schema } from 'effect';

/** ─── Limits ─────────────────────────────────────────────────────────────── */

/** Maximum accepted serialized component bundle size, in bytes; matches adapter-node's 512 KiB default. */
export const MAX_COMPONENT_BUNDLE_SIZE = 512 * 1024;

/** User-facing message returned when a component bundle exceeds the size limit. */
export const COMPONENT_BUNDLE_SIZE_MESSAGE = 'Component bundle exceeds the 512 KiB limit';

/** ─── Component record ───────────────────────────────────────────────────── */

export const ComponentTypeSchema = Schema.Literal(
  'callbacks',
  'stages',
  'containers',
  'headers',
  'footers',
);

export type ComponentType = typeof ComponentTypeSchema.Type;

/** Client-editable component metadata. Dates are deliberately excluded because the server owns them. */
export const ComponentMetaSchema = Schema.Struct({
  name: Schema.String,
  displayName: Schema.String,
  publish: Schema.Boolean,
  fromComponent: Schema.String,
  fromJson: Schema.String,
});

/**
 * Canonical ISO-8601, as `DateTime.formatIso` emits:
 *
 *   '2026-10-18T12:34:56.000Z'  ✓      '2026-10-18'  ✗      '2026-13-45T…'  ✗
 */
const isoDate = Schema.String.pipe(
  Schema.filter(
    (date) => DateTime.make(date).pipe(Option.map(DateTime.formatIso), Option.contains(date)),
    { message: () => 'Date must be ISO-8601' },
  ),
);

/** Persisted component metadata, including server-owned ISO creation and modification dates. */
export const ComponentMetaWithDatesSchema = Schema.Struct({
  ...ComponentMetaSchema.fields,
  createdDate: isoDate,
  modifiedDate: isoDate,
});

/** A complete persisted component record. Component ids and dates are server-owned. */
export const ComponentRecordSchema = Schema.Struct({
  id: Schema.UUID,
  src: Schema.String, // the component's Svelte source code, not a path
  json: Schema.optional(Schema.Unknown), // mock data fed to the component for preview
  meta: ComponentMetaWithDatesSchema,
});

/** ─── Fields projection ──────────────────────────────────────────────────── */

const fieldsPattern = /^[^.\s,]+(?:\.[^.\s,]+)*(?:,[^.\s,]+(?:\.[^.\s,]+)*)*$/;

/** A comma-separated, dot-notation projection accepted by component list and detail routes. */
export const FieldsSchema = Schema.String.pipe(
  Schema.filter((fields) => fields === '' || fieldsPattern.test(fields), {
    message: () => 'Invalid fields projection',
  }),
);

/** ─── Request bodies ─────────────────────────────────────────────────────── */

/**
 * Request body for component creation. Server-owned fields (id, dates) are declared
 * as optional `Never` — a client that supplies one is rejected, not ignored:
 *
 *   { src, meta }                                   ✓    { src, meta, id }         ✗ 400
 *   { src, meta: { name, … } }                      ✓    { meta: { createdDate } } ✗ 400
 */
export const CreateComponentRequestSchema = Schema.Struct({
  src: Schema.String.pipe(
    Schema.filter((src) => src.length <= MAX_COMPONENT_BUNDLE_SIZE, {
      message: () => COMPONENT_BUNDLE_SIZE_MESSAGE,
    }),
  ),
  json: Schema.optional(Schema.Unknown),
  meta: Schema.Struct({
    ...ComponentMetaSchema.fields,
    createdDate: Schema.optional(Schema.Never),
    modifiedDate: Schema.optional(Schema.Never),
  }),
  id: Schema.optional(Schema.Never),
});

export type CreateComponentRequest = typeof CreateComponentRequestSchema.Type;

/** Request body for component updates: the create body, plus an optional id checked against the route id. */
export const UpdateComponentRequestSchema = Schema.Struct({
  ...CreateComponentRequestSchema.fields,
  id: Schema.optional(Schema.UUID),
});

export type UpdateComponentRequest = typeof UpdateComponentRequestSchema.Type;

export const PublishRequestSchema = Schema.Struct({
  code: Schema.String,
});

export type PublishRequest = typeof PublishRequestSchema.Type;

/** ─── Responses and errors ───────────────────────────────────────────────── */

/** HTTP statuses representable in Component API error responses. */
export const ApiErrorStatusSchema = Schema.Literal(400, 401, 403, 404, 413, 415, 500, 503);

export type ApiErrorStatus = typeof ApiErrorStatusSchema.Type;

export const ApiErrorBodySchema = Schema.Struct({ error: Schema.String });

export const ComponentErrorResponseSchema = Schema.Struct({
  status: ApiErrorStatusSchema,
  body: ApiErrorBodySchema,
});

/** A client-facing HTTP failure encoded as the response's status and JSON error body. */
export class HttpError extends Data.TaggedError('HttpError')<{
  readonly status: ApiErrorStatus;
  readonly message: string;
  readonly cause?: unknown;
}> {}
