/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Schema } from 'effect';

/**
 * Defines the maximum accepted serialized component bundle size in characters.
 *
 * @category limits
 */
export const MAX_COMPONENT_BUNDLE_SIZE = 1024 * 1024;

/**
 * Defines the client-facing failure message for an oversized component bundle.
 *
 * @see {@link MAX_COMPONENT_BUNDLE_SIZE} for the enforced limit.
 * @category errors
 */
export const COMPONENT_BUNDLE_SIZE_MESSAGE = 'Component bundle exceeds the 1 MiB limit';

/**
 * Defines the component categories supported by the Component API.
 *
 * @category schemas
 */
export const ComponentTypeSchema = Schema.Literal(
  'callbacks',
  'stages',
  'containers',
  'headers',
  'footers',
);

/**
 * Represents a component category supported by the Component API.
 *
 * @category models
 */
export type ComponentType = Schema.Schema.Type<typeof ComponentTypeSchema>;

/**
 * Defines client-editable component metadata.
 *
 * **Gotchas**
 *
 * Creation and modification dates are deliberately absent because the server owns them.
 *
 * @see {@link ComponentMetaWithDatesSchema} for persisted metadata.
 * @category schemas
 */
export const ComponentMetaSchema = Schema.Struct({
  name: Schema.String,
  displayName: Schema.String,
  publish: Schema.Boolean,
  fromComponent: Schema.String,
  fromJson: Schema.String,
});

const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * Defines persisted component metadata including server-owned ISO dates.
 *
 * @see {@link ComponentMetaSchema} for client-editable metadata.
 * @category schemas
 */
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

/**
 * Defines a server-assigned component UUID.
 *
 * @category schemas
 */
export const ComponentIdSchema = Schema.String.pipe(
  Schema.filter((id) => id.length > 0 && uuidPattern.test(id), {
    message: () => 'Invalid component id',
  }),
);

/**
 * Defines a complete persisted component record.
 *
 * **Gotchas**
 *
 * Component IDs and metadata dates are server-owned and cannot be supplied in create requests.
 *
 * @category schemas
 */
export const ComponentRecordSchema = Schema.Struct({
  id: ComponentIdSchema,
  src: Schema.String,
  json: Schema.optional(Schema.Unknown),
  meta: ComponentMetaWithDatesSchema,
});

/**
 * Represents a complete persisted component record.
 *
 * @category models
 */
export type ComponentRecord = Schema.Schema.Type<typeof ComponentRecordSchema>;

const fieldsPattern = /^[^.\s,]+(?:\.[^.\s,]+)*(?:,[^.\s,]+(?:\.[^.\s,]+)*)*$/;

/**
 * Defines a comma-separated dot-notation record projection.
 *
 * **Example** (Selecting nested fields)
 *
 * ```ts
 * const projection = "id,meta.displayName"
 * ```
 *
 * @category schemas
 */
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

/**
 * Defines the request body for component creation.
 *
 * **Gotchas**
 *
 * The server assigns the component ID and metadata dates.
 *
 * @category schemas
 */
export const CreateComponentRequestSchema = Schema.Struct({
  ...createComponentRequestFields,
  id: Schema.optional(Schema.Never),
  meta: ClientComponentMetaSchema,
});

/**
 * Defines the request body for component updates.
 *
 * **Gotchas**
 *
 * When supplied, the body ID must match the route ID.
 *
 * @category schemas
 */
export const UpdateComponentRequestSchema = Schema.Struct({
  ...createComponentRequestFields,
  id: Schema.optional(ComponentIdSchema),
  meta: ClientComponentMetaSchema,
});

/**
 * Defines one path-and-content entry in a component bundle.
 *
 * @category schemas
 */
export const PublishFileSchema = Schema.Struct({ path: Schema.String, content: Schema.String });

/**
 * Defines a serialized component bundle payload.
 *
 * @category schemas
 */
export const BundleSchema = Schema.Struct({
  files: Schema.Array(PublishFileSchema),
});

/**
 * Represents a decoded component bundle payload.
 *
 * @category models
 */
export type Bundle = Schema.Schema.Type<typeof BundleSchema>;

/**
 * Defines a request body for publishing source code and optional component files.
 *
 * @category schemas
 */
export const PublishRequestSchema = Schema.Struct({
  code: Schema.String,
  files: Schema.optional(Schema.Array(PublishFileSchema)),
});

/**
 * Defines the response returned after component source publication.
 *
 * @category schemas
 */
export const PublishResponseSchema = Schema.Struct({
  id: ComponentIdSchema,
  url: Schema.String,
});

/**
 * Defines the standard error payload for Component API responses.
 *
 * @category schemas
 */
export const ApiErrorBodySchema = Schema.Struct({ error: Schema.String });

/**
 * Builds a tagged Component API response schema for a status and body.
 *
 * **When to use**
 *
 * Use when an endpoint response must couple a literal status code to its body schema.
 *
 * **Example** (Defining a successful response)
 *
 * ```ts
 * const created = statusResponseSchema(201, ComponentRecordSchema)
 * ```
 *
 * @category schemas
 *
 * @param status - The HTTP status represented by the schema.
 * @param bodySchema - The response body schema for the status.
 * @returns A schema pairing the literal status with its body.
 */
export const statusResponseSchema = <const Status extends number, Body>(
  status: Status,
  bodySchema: Schema.Schema<Body>,
) => Schema.Struct({ status: Schema.Literal(status), body: bodySchema });

/**
 * Defines error responses shared by Component API routes.
 *
 * @category schemas
 */
export const ComponentErrorResponseSchema = Schema.Union(
  statusResponseSchema(400, ApiErrorBodySchema),
  statusResponseSchema(401, ApiErrorBodySchema),
  statusResponseSchema(404, ApiErrorBodySchema),
  statusResponseSchema(409, ApiErrorBodySchema),
  statusResponseSchema(413, ApiErrorBodySchema),
  statusResponseSchema(415, ApiErrorBodySchema),
  statusResponseSchema(500, ApiErrorBodySchema),
);

/**
 * Defines the response contract for a component-list route.
 *
 * @category schemas
 */
export const ComponentListResponseSchema = Schema.Union(
  statusResponseSchema(200, Schema.Array(ComponentRecordSchema)),
  ComponentErrorResponseSchema,
);

/**
 * Defines the response contract for component detail, create, and update routes.
 *
 * @category schemas
 */
export const ComponentResponseSchema = Schema.Union(
  statusResponseSchema(200, ComponentRecordSchema),
  statusResponseSchema(201, ComponentRecordSchema),
  statusResponseSchema(204, Schema.Void),
  ComponentErrorResponseSchema,
);

/**
 * Represents a typed Component API detail response.
 *
 * @category models
 */
export type ComponentResponse = Schema.Schema.Type<typeof ComponentResponseSchema>;
