/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Schema } from 'effect';

/** Maximum accepted serialized component bundle size, in bytes; matches adapter-node's 512 KiB default. */
export const MAX_COMPONENT_BUNDLE_SIZE = 512 * 1024;

/** User-facing message returned when a component bundle exceeds the size limit. */
export const COMPONENT_BUNDLE_SIZE_MESSAGE = 'Component bundle exceeds the 512 KiB limit';

/** Component categories supported by the Component API. */
export const ComponentTypeSchema = Schema.Literal(
  'callbacks',
  'stages',
  'containers',
  'headers',
  'footers',
);

/** A component category supported by the Component API. */
export type ComponentType = typeof ComponentTypeSchema.Type;

/** Client-editable component metadata. Dates are deliberately excluded because the server owns them. */
export const ComponentMetaSchema = Schema.Struct({
  name: Schema.String,
  displayName: Schema.String,
  publish: Schema.Boolean,
  fromComponent: Schema.String,
  fromJson: Schema.String,
});

const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/** Persisted component metadata, including server-owned ISO creation and modification dates. */
export const ComponentMetaWithDatesSchema = Schema.Struct({
  ...ComponentMetaSchema.fields,
  createdDate: Schema.String.pipe(
    Schema.filter((date) => isoDatePattern.test(date), { message: () => 'Date must be ISO-8601' }),
  ),
  modifiedDate: Schema.String.pipe(
    Schema.filter((date) => isoDatePattern.test(date), { message: () => 'Date must be ISO-8601' }),
  ),
});

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** A non-empty UUID assigned by the server to identify a component. */
export const ComponentIdSchema = Schema.String.pipe(
  Schema.filter((id) => id.length > 0 && uuidPattern.test(id), {
    message: () => 'Invalid component id',
  }),
);

/** A complete persisted component record. Component ids and dates are server-owned. */
export const ComponentRecordSchema = Schema.Struct({
  id: ComponentIdSchema,
  src: Schema.String,
  json: Schema.optional(Schema.Unknown),
  meta: ComponentMetaWithDatesSchema,
});

/** A complete persisted component record. */
export type ComponentRecord = typeof ComponentRecordSchema.Type;

const fieldsPattern = /^[^.\s,]+(?:\.[^.\s,]+)*(?:,[^.\s,]+(?:\.[^.\s,]+)*)*$/;

/** A comma-separated, dot-notation projection accepted by component list and detail routes. */
export const FieldsSchema = Schema.String.pipe(
  Schema.filter((fields) => fields === '' || fieldsPattern.test(fields), {
    message: () => 'Invalid fields projection',
  }),
);

const createComponentRequestFields = {
  src: Schema.String.pipe(
    Schema.filter((src) => src.length <= MAX_COMPONENT_BUNDLE_SIZE, {
      message: () => COMPONENT_BUNDLE_SIZE_MESSAGE,
    }),
  ),
  json: Schema.optional(Schema.Unknown),
  meta: ComponentMetaSchema,
};

const ClientComponentMetaSchema = Schema.Struct({
  ...ComponentMetaSchema.fields,
  createdDate: Schema.optional(Schema.Never),
  modifiedDate: Schema.optional(Schema.Never),
});

/** Request body for component creation. The server, not clients, assigns its id and dates. */
export const CreateComponentRequestSchema = Schema.Struct({
  ...createComponentRequestFields,
  id: Schema.optional(Schema.Never),
  meta: ClientComponentMetaSchema,
});

/** Request body for component creation. */
export type CreateComponentRequest = typeof CreateComponentRequestSchema.Type;

/** Request body for component updates. An optional id is later checked against the route id. */
export const UpdateComponentRequestSchema = Schema.Struct({
  ...createComponentRequestFields,
  id: Schema.optional(ComponentIdSchema),
  meta: ClientComponentMetaSchema,
});

/** Request body for component updates. */
export type UpdateComponentRequest = typeof UpdateComponentRequestSchema.Type;

/** An individual path and content entry in a component bundle. */
export const PublishFileSchema = Schema.Struct({ path: Schema.String, content: Schema.String });

/** Schema for a serialized component bundle payload. */
export const BundleSchema = Schema.Struct({
  files: Schema.Array(PublishFileSchema),
});

/** A decoded component bundle payload. */
export type Bundle = typeof BundleSchema.Type;

/** Request body for publishing source code and optional additional component files. */
export const PublishRequestSchema = Schema.Struct({
  code: Schema.String,
  files: Schema.optional(Schema.Array(PublishFileSchema)),
});

/** Response returned after a component source bundle has been published. */
export const PublishResponseSchema = Schema.Struct({
  id: ComponentIdSchema,
  url: Schema.String,
});

/** Standard error payload for Component API responses. */
export const ApiErrorBodySchema = Schema.Struct({ error: Schema.String });

/** Error responses shared by Component API routes. */
export const ComponentErrorResponseSchema = Schema.Union(
  Schema.Struct({ status: Schema.Literal(400), body: ApiErrorBodySchema }),
  Schema.Struct({ status: Schema.Literal(401), body: ApiErrorBodySchema }),
  Schema.Struct({ status: Schema.Literal(403), body: ApiErrorBodySchema }),
  Schema.Struct({ status: Schema.Literal(404), body: ApiErrorBodySchema }),
  Schema.Struct({ status: Schema.Literal(413), body: ApiErrorBodySchema }),
  Schema.Struct({ status: Schema.Literal(415), body: ApiErrorBodySchema }),
  Schema.Struct({ status: Schema.Literal(500), body: ApiErrorBodySchema }),
  Schema.Struct({ status: Schema.Literal(503), body: ApiErrorBodySchema }),
);
