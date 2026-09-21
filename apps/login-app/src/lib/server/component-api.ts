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

/** User-facing messages returned when component API validation fails. */
export const SaveEndpointErrorMessage = {
  bundleTooLarge: 'Component bundle exceeds the 1 MiB limit',
  invalidContentType: 'Content-Type must be application/json',
  unauthorized: 'Unauthorized',
  notFound: 'Component not found',
  invalidComponentType: 'Invalid component type',
  invalidComponentId: 'Invalid component id',
  invalidFields: 'Invalid fields projection',
} as const;

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
    message: () => SaveEndpointErrorMessage.invalidComponentId,
  }),
);

/** A complete persisted component record. Component ids and dates are server-owned. */
export const ComponentRecordSchema = Schema.Struct({
  id: ComponentIdSchema,
  src: Schema.String,
  json: Schema.optional(Schema.Unknown),
  meta: ComponentMetaWithDatesSchema,
});

const fieldsPattern = /^[^.\s,]+(?:\.[^.\s,]+)*(?:,[^.\s,]+(?:\.[^.\s,]+)*)*$/;

/** A comma-separated, dot-notation projection accepted by component list and detail routes. */
export const FieldsSchema = Schema.String.pipe(
  Schema.filter((fields) => fields === '' || fieldsPattern.test(fields), {
    message: () => SaveEndpointErrorMessage.invalidFields,
  }),
);

/**
 * Parses a fields projection into property paths.
 *
 * @param input - A comma-separated projection, or null when no projection was supplied.
 * @returns Immutable dot-notation property paths; an empty result represents the full record.
 * @throws {Error} When a path contains an empty segment.
 */
export const parseFields = (input: string | null): ReadonlyArray<ReadonlyArray<string>> => {
  if (input === null || input.trim() === '') return [];

  return input.split(',').map((path) => {
    const segments = path.split('.').map((segment) => segment.trim());
    if (segments.some((segment) => segment.length === 0)) {
      throw new Error(SaveEndpointErrorMessage.invalidFields);
    }
    return segments;
  });
};

/**
 * Returns a record containing only requested top-level or nested property paths.
 *
 * @param record - The source component record.
 * @param fields - Parsed projection paths; no paths retains the full record.
 * @returns A new, projected record.
 */
export const projectRecord = (
  record: Record<string, unknown>,
  fields: ReadonlyArray<ReadonlyArray<string>>,
): Record<string, unknown> => {
  if (fields.length === 0) return { ...record };

  const projected: Record<string, unknown> = {};
  for (const path of fields) {
    let source: unknown = record;
    let destination: Record<string, unknown> = projected;

    for (let index = 0; index < path.length; index += 1) {
      const segment = path[index];
      if (typeof source !== 'object' || source === null || !(segment in source)) break;
      const value = (source as Record<string, unknown>)[segment];
      if (index === path.length - 1) {
        destination[segment] = value;
      } else {
        const next = destination[segment];
        if (typeof next !== 'object' || next === null || Array.isArray(next)) {
          destination[segment] = {};
        }
        destination = destination[segment] as Record<string, unknown>;
        source = value;
      }
    }
  }
  return projected;
};

const createComponentRequestFields = {
  src: Schema.String.pipe(
    Schema.filter((src) => src.length <= MAX_COMPONENT_BUNDLE_SIZE, {
      message: () => SaveEndpointErrorMessage.bundleTooLarge,
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

const PublishFileSchema = Schema.Struct({ path: Schema.String, content: Schema.String });

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

/** Creates a tagged Component API response schema for a status and response body. */
export const statusResponseSchema = <const Status extends number, Body>(
  status: Status,
  bodySchema: Schema.Schema<Body>,
) => Schema.Struct({ status: Schema.Literal(status), body: bodySchema });

/** Error responses shared by Component API routes. */
export const ComponentErrorResponseSchema = Schema.Union(
  statusResponseSchema(400, ApiErrorBodySchema),
  statusResponseSchema(401, ApiErrorBodySchema),
  statusResponseSchema(404, ApiErrorBodySchema),
  statusResponseSchema(409, ApiErrorBodySchema),
  statusResponseSchema(413, ApiErrorBodySchema),
  statusResponseSchema(415, ApiErrorBodySchema),
  statusResponseSchema(500, ApiErrorBodySchema),
);

/** Response contract for a component-list route. */
export const ComponentListResponseSchema = Schema.Union(
  statusResponseSchema(200, Schema.Array(ComponentRecordSchema)),
  ComponentErrorResponseSchema,
);

/** Response contract for component detail, create, and update routes. */
export const ComponentResponseSchema = Schema.Union(
  statusResponseSchema(200, ComponentRecordSchema),
  statusResponseSchema(201, ComponentRecordSchema),
  statusResponseSchema(204, Schema.Void),
  ComponentErrorResponseSchema,
);

/** A typed Component API detail response. */
export type ComponentResponse = Schema.Schema.Type<typeof ComponentResponseSchema>;

/**
 * Converts a validated Component API response contract into an HTTP response.
 *
 * @param response - The tagged response contract to encode.
 * @returns A platform response with its corresponding status and JSON body.
 */
export const encodeComponentResponse = (response: ComponentResponse): Response => {
  const encoded = Schema.encodeSync(ComponentResponseSchema)(response);
  return encoded.status === 204
    ? new Response(null, { status: encoded.status })
    : Response.json(encoded.body, { status: encoded.status });
};
