/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { z } from 'zod';

/** Maximum accepted serialized component bundle size, in characters. */
export const MAX_COMPONENT_BUNDLE_SIZE = 1024 * 1024;

/** User-facing message returned when a component bundle exceeds the size limit. */
export const COMPONENT_BUNDLE_SIZE_MESSAGE = 'Component bundle exceeds the 1 MiB limit';

/** Component categories supported by the Component API. */
export const ComponentTypeSchema = z.enum([
  'callbacks',
  'stages',
  'containers',
  'headers',
  'footers',
]);

/** A component category supported by the Component API. */
export type ComponentType = z.infer<typeof ComponentTypeSchema>;

/** Client-editable component metadata. Dates are deliberately excluded because the server owns them. */
export const ComponentMetaSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  publish: z.boolean(),
  fromComponent: z.string(),
  fromJson: z.string(),
});

const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/** Persisted component metadata, including server-owned ISO creation and modification dates. */
export const ComponentMetaWithDatesSchema = ComponentMetaSchema.extend({
  createdDate: z.string().refine((date) => isoDatePattern.test(date), 'Date must be ISO-8601'),
  modifiedDate: z.string().refine((date) => isoDatePattern.test(date), 'Date must be ISO-8601'),
});

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** A non-empty UUID assigned by the server to identify a component. */
export const ComponentIdSchema = z
  .string()
  .refine((id) => id.length > 0 && uuidPattern.test(id), 'Invalid component id');

/** A complete persisted component record. Component ids and dates are server-owned. */
export const ComponentRecordSchema = z.object({
  id: ComponentIdSchema,
  src: z.string(),
  json: z.unknown().optional(),
  meta: ComponentMetaWithDatesSchema,
});

/** A complete persisted component record. */
export type ComponentRecord = z.infer<typeof ComponentRecordSchema>;

const fieldsPattern = /^[^.\s,]+(?:\.[^.\s,]+)*(?:,[^.\s,]+(?:\.[^.\s,]+)*)*$/;

/** A comma-separated, dot-notation projection accepted by component list and detail routes. */
export const FieldsSchema = z
  .string()
  .refine((fields) => fields === '' || fieldsPattern.test(fields), 'Invalid fields projection');

const createComponentRequestFields = {
  src: z
    .string()
    .refine((src) => src.length <= MAX_COMPONENT_BUNDLE_SIZE, COMPONENT_BUNDLE_SIZE_MESSAGE),
  json: z.unknown().optional(),
};

/** Client metadata that may be sent on create/update; server-owned date keys are rejected. */
export const ClientComponentMetaSchema = ComponentMetaSchema.extend({
  createdDate: z.never().optional(),
  modifiedDate: z.unknown().optional(),
});

/** Request body for component creation. The server, not clients, assigns its id and dates. */
export const CreateComponentRequestSchema = z.object({
  ...createComponentRequestFields,
  meta: ClientComponentMetaSchema,
  id: z.never().optional(),
});

/** Request body for component creation. */
export type CreateComponentRequest = z.infer<typeof CreateComponentRequestSchema>;

/** Request body for component updates. An optional id is later checked against the route id. */
export const UpdateComponentRequestSchema = z.object({
  ...createComponentRequestFields,
  meta: ClientComponentMetaSchema,
  id: ComponentIdSchema.optional(),
});

/** Request body for component updates. */
export type UpdateComponentRequest = z.infer<typeof UpdateComponentRequestSchema>;

/** An individual path and content entry in a component bundle. */
export const PublishFileSchema = z.object({ path: z.string(), content: z.string() });

/** Schema for a serialized component bundle payload. */
export const BundleSchema = z.object({ files: z.array(PublishFileSchema) });

/** A decoded component bundle payload. */
export type Bundle = z.infer<typeof BundleSchema>;

/** Request body for publishing source code and optional additional component files. */
export const PublishRequestSchema = z.object({
  code: z.string(),
  files: z.array(PublishFileSchema).optional(),
});

/** Response returned after a component source bundle has been published. */
export const PublishResponseSchema = z.object({ id: ComponentIdSchema, url: z.string() });

/** Standard error payload for Component API responses. */
export const ApiErrorBodySchema = z.object({ error: z.string() });

/** Error responses shared by Component API routes. */
export const ComponentErrorResponseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal(400), body: ApiErrorBodySchema }),
  z.object({ status: z.literal(401), body: ApiErrorBodySchema }),
  z.object({ status: z.literal(403), body: ApiErrorBodySchema }),
  z.object({ status: z.literal(404), body: ApiErrorBodySchema }),
  z.object({ status: z.literal(413), body: ApiErrorBodySchema }),
  z.object({ status: z.literal(415), body: ApiErrorBodySchema }),
  z.object({ status: z.literal(500), body: ApiErrorBodySchema }),
]);
