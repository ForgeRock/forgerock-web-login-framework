/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Schema } from 'effect';

/** Maximum accepted serialized component bundle size, in characters. */
export const MAX_COMPONENT_BUNDLE_SIZE = 1024 * 1024;

/** User-facing message returned when a component bundle exceeds the size limit. */
export const COMPONENT_BUNDLE_SIZE_MESSAGE = 'Component bundle exceeds the 1 MiB limit';

/** Component categories supported by the Component API. */
export const ComponentTypeSchema = Schema.Literal(
  'callbacks',
  'stages',
  'containers',
  'headers',
  'footers',
);

/** A component category supported by the Component API. */
export type ComponentType = Schema.Schema.Type<typeof ComponentTypeSchema>;

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
export type ComponentRecord = Schema.Schema.Type<typeof ComponentRecordSchema>;

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

/** Request body for component updates. An optional id is later checked against the route id. */
export const UpdateComponentRequestSchema = Schema.Struct({
  ...createComponentRequestFields,
  id: Schema.optional(ComponentIdSchema),
  meta: ClientComponentMetaSchema,
});

/** An individual path and content entry in a component bundle. */
export const PublishFileSchema = Schema.Struct({ path: Schema.String, content: Schema.String });

/** Schema for a serialized component bundle payload. */
export const BundleSchema = Schema.Struct({
  files: Schema.Array(PublishFileSchema),
});

/** A decoded component bundle payload. */
export type Bundle = Schema.Schema.Type<typeof BundleSchema>;

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

/** Creates a tagged Component API response schema pairing a literal status with its body schema. */
export const statusResponseSchema = <const Status extends number, Body>(
  status: Status,
  bodySchema: Schema.Schema<Body>,
) => Schema.Struct({ status: Schema.Literal(status), body: bodySchema });

/** Error responses shared by Component API routes. */
export const ComponentErrorResponseSchema = Schema.Union(
  statusResponseSchema(400, ApiErrorBodySchema),
  statusResponseSchema(401, ApiErrorBodySchema),
  statusResponseSchema(403, ApiErrorBodySchema),
  statusResponseSchema(404, ApiErrorBodySchema),
  statusResponseSchema(413, ApiErrorBodySchema),
  statusResponseSchema(415, ApiErrorBodySchema),
  statusResponseSchema(500, ApiErrorBodySchema),
);
