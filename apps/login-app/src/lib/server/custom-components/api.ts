/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { type ComponentType, FieldsSchema } from './fields.utils';
import {
  COMPONENT_BUNDLE_SIZE_MESSAGE,
  ComponentErrorResponseSchema,
  ComponentIdSchema,
  ComponentRecordSchema,
  ComponentTypeSchema,
  CreateComponentRequestSchema,
  MAX_COMPONENT_BUNDLE_SIZE,
  projectRecord,
  PublishRequestSchema,
  UpdateComponentRequestSchema,
} from './fields.utils';
import { publishBundle, publishResponse } from './publisher';

import type { z } from 'zod';

import type {
  ApiErrorStatus,
  ComponentApiDependencies,
  ComponentAuthFailureReason,
  ComponentPublishError,
  ComponentPublishFailureReason,
  ComponentStoreFailureReason,
  ComponentStoreResult,
  HttpError,
} from './component.types';

/** Whether this deployment serves the Component API. Disabled deployments 404 every route. */
export const isComponentApiEnabled = (): boolean => process.env.COMPONENT_API_ENABLED === 'true';

/** Maps an authentication failure reason to the HTTP status a client should see. */
const AUTH_STATUS: Record<ComponentAuthFailureReason, ApiErrorStatus> = {
  Unauthenticated: 401,
  Forbidden: 403,
  Unavailable: 500,
};

/** Maps a store failure reason to the HTTP status a client should see. */
const STORE_STATUS: Record<ComponentStoreFailureReason, ApiErrorStatus> = {
  NotFound: 404,
  Storage: 500,
};

/** Maps a publish failure reason to the HTTP status a client should see. */
const PUBLISH_STATUS: Record<ComponentPublishFailureReason, ApiErrorStatus> = {
  Invalid: 400,
  Storage: 500,
};

/** Encodes an error body as a JSON response. */
const errorResponse = (status: ApiErrorStatus, error: string): Response => {
  const encoded = ComponentErrorResponseSchema.parse({ status, body: { error } });
  return Response.json(encoded.body, { status: encoded.status });
};

/** Encodes a validated component record as a JSON response. */
const recordResponse = (
  status: 200 | 201,
  record: z.infer<typeof ComponentRecordSchema>,
): Response => Response.json(ComponentRecordSchema.parse(record), { status });

/** Encodes an HttpError value into its HTTP response. */
const toErrorResponse = (error: HttpError): Response => errorResponse(error.status, error.message);

/** Runs a handler body; a returned HttpError value becomes its HTTP response. */
const toResponse = async (handle: () => Promise<Response | HttpError>): Promise<Response> => {
  const outcome = await handle();
  return outcome instanceof Response ? outcome : toErrorResponse(outcome);
};

/** Converts a storage result into its response value or client-facing HttpError. */
const fromStoreResult = <Value>(
  result: ComponentStoreResult<Value>,
  onSuccess: (value: Value) => Response,
): Response | HttpError =>
  result.success
    ? onSuccess(result.value)
    : { status: STORE_STATUS[result.error.reason], message: result.error.message };

/**
 * Enforces API enablement (`COMPONENT_API_ENABLED=true`), AM admin authentication, JSON content
 * type, and the declared body size limit. Disabled deployments 404; authentication fails closed.
 */
const guardRequest = async (
  request: Request,
  hasBody: boolean,
  dependencies: Pick<ComponentApiDependencies, 'authenticate'>,
): Promise<HttpError | undefined> => {
  if (!isComponentApiEnabled()) {
    return { status: 404, message: 'Not found' };
  }
  const auth = await dependencies.authenticate(request);
  if (!auth.success) {
    return { status: AUTH_STATUS[auth.error.reason], message: auth.error.message };
  }
  if (
    hasBody &&
    request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() !==
      'application/json'
  ) {
    return { status: 415, message: 'Content-Type must be application/json' };
  }
  if (!hasBody) {
    return undefined;
  }
  const header = request.headers.get('content-length');
  if (header === null) {
    return undefined;
  }
  const length = Number(header);
  if (!(Number.isFinite(length) && length <= MAX_COMPONENT_BUNDLE_SIZE)) {
    return { status: 413, message: COMPONENT_BUNDLE_SIZE_MESSAGE };
  }
  return undefined;
};

/** Reads and decodes a size-limited JSON request body. */
const readBody = async <S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<{ ok: true; body: z.output<S> } | { ok: false; error: HttpError }> => {
  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return { ok: false, error: { status: 400, message: 'Unable to read component request body' } };
  }
  if (bodyText.length > MAX_COMPONENT_BUNDLE_SIZE) {
    return { ok: false, error: { status: 413, message: COMPONENT_BUNDLE_SIZE_MESSAGE } };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return { ok: false, error: { status: 400, message: 'Invalid request body' } };
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, error: { status: 400, message: 'Invalid request body' } };
  }
  return { ok: true, body: result.data as z.output<S> };
};

/** Validates a route component type, 404 on unknown values. */
const validateType = (
  type: string,
): { ok: true; type: ComponentType } | { ok: false; error: HttpError } => {
  const result = ComponentTypeSchema.safeParse(type);
  return result.success
    ? { ok: true, type: result.data }
    : { ok: false, error: { status: 404, message: 'Invalid component type' } };
};

/** Validates a route component id, 400 on non-UUID values. */
const validateId = (id: string): { ok: true; id: string } | { ok: false; error: HttpError } => {
  const result = ComponentIdSchema.safeParse(id);
  return result.success
    ? { ok: true, id: result.data }
    : { ok: false, error: { status: 400, message: 'Invalid component id' } };
};

/** Parses the `?fields=` query parameter into projection paths, 400 on an invalid projection. */
const parseProjection = (
  request: Request,
): { ok: true; fields: ReadonlyArray<ReadonlyArray<string>> } | { ok: false; error: HttpError } => {
  const fieldsInput = new URL(request.url).searchParams.get('fields');
  if (fieldsInput === null || fieldsInput === '') {
    return { ok: true, fields: [] };
  }
  const result = FieldsSchema.safeParse(fieldsInput);
  if (!result.success) {
    return { ok: false, error: { status: 400, message: 'Invalid fields projection' } };
  }
  return {
    ok: true,
    fields: result.data.split(',').map((path) => path.split('.').map((segment) => segment.trim())),
  };
};

/** Maps a publication failure to its client-facing HTTP status and message. */
const httpPublishError = (error: ComponentPublishError): HttpError => ({
  status: PUBLISH_STATUS[error.reason],
  message: error.message,
});

/**
 * Shared skeleton for every Component API handler: guard, optional body decode, operation,
 * and store-error mapping.
 */
const handler = async <Body>(
  request: Request,
  hasBody: boolean,
  bodySchema: z.ZodType<Body> | undefined,
  operation: (context: {
    store: ComponentApiDependencies['store'];
    body: Body | undefined;
  }) => Promise<Response | HttpError>,
  dependencies: ComponentApiDependencies,
): Promise<Response> =>
  toResponse(async () => {
    const guarded = await guardRequest(request, hasBody, dependencies);
    if (guarded !== undefined) {
      return guarded;
    }
    if (bodySchema === undefined) {
      return operation({ store: dependencies.store, body: undefined });
    }
    const body = await readBody(request, bodySchema);
    return body.ok ? operation({ store: dependencies.store, body: body.body }) : body.error;
  });

/**
 * Lists component records for a route type, projecting fields from the `?fields=` query parameter.
 *
 * @param request - Incoming request with an optional `fields` query parameter.
 * @param type - Component category from the route path.
 * @param dependencies - Handler dependencies (authenticate, store, publish).
 * @returns 200 with the projected records, 400 for an invalid projection, 404 when disabled or the type is invalid.
 */
export const listComponents = async (
  request: Request,
  type: string,
  dependencies: ComponentApiDependencies,
): Promise<Response> =>
  toResponse(async () => {
    const guarded = await guardRequest(request, false, dependencies);
    if (guarded !== undefined) {
      return guarded;
    }
    const validType = validateType(type);
    if (!validType.ok) {
      return validType.error;
    }
    const fields = parseProjection(request);
    if (!fields.ok) {
      return fields.error;
    }
    const records = await dependencies.store.list(validType.type);
    return fromStoreResult(records, (found) =>
      Response.json(found.map((record) => projectRecord(record, fields.fields))),
    );
  });

/**
 * Retrieves a component record by its route type and id.
 *
 * @param request - Incoming request.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path.
 * @param dependencies - Handler dependencies (authenticate, store, publish).
 * @returns 200 with the record, 400 for an invalid id, 404 when disabled, the type is invalid, or the record is missing.
 */
export const getComponent = async (
  request: Request,
  type: string,
  id: string,
  dependencies: ComponentApiDependencies,
): Promise<Response> =>
  handler(
    request,
    false,
    undefined,
    async ({ store }) => {
      const validType = validateType(type);
      if (!validType.ok) {
        return validType.error;
      }
      const validId = validateId(id);
      if (!validId.ok) {
        return validId.error;
      }
      const record = await store.get(validType.type, validId.id);
      return fromStoreResult(record, (found) => recordResponse(200, found));
    },
    dependencies,
  );

/**
 * Creates a component record in the requested route type; the server assigns its id and dates.
 *
 * @param request - JSON request containing the client-editable component fields.
 * @param type - Component category from the route path.
 * @param dependencies - Handler dependencies (authenticate, store, publish).
 * @returns 201 with the created record; 400 for malformed input, 404 when disabled or the type is invalid.
 */
export const createComponent = async (
  request: Request,
  type: string,
  dependencies: ComponentApiDependencies,
): Promise<Response> =>
  handler(
    request,
    true,
    CreateComponentRequestSchema,
    async ({ store, body }) => {
      const validType = validateType(type);
      if (!validType.ok) {
        return validType.error;
      }
      const record = await store.create(validType.type, body!);
      return fromStoreResult(record, (created) => recordResponse(201, created));
    },
    dependencies,
  );

/**
 * Updates an existing component record, preserving its creation date.
 * A body id, when present, must match the route id.
 *
 * @param request - JSON request containing the replacement client-editable component fields.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path.
 * @param dependencies - Handler dependencies (authenticate, store, publish).
 * @returns 200 with the updated record, 400 for malformed input or a mismatched body id, 404 when disabled, the type is invalid, or the record is missing.
 */
export const updateComponent = async (
  request: Request,
  type: string,
  id: string,
  dependencies: ComponentApiDependencies,
): Promise<Response> =>
  handler(
    request,
    true,
    UpdateComponentRequestSchema,
    async ({ store, body }) => {
      const validType = validateType(type);
      if (!validType.ok) {
        return validType.error;
      }
      const validId = validateId(id);
      if (!validId.ok) {
        return validId.error;
      }
      if (body!.id !== undefined && body!.id !== validId.id) {
        return { status: 400, message: 'Invalid component id' };
      }
      const record = await store.update(validType.type, validId.id, body!);
      return fromStoreResult(record, (updated) => recordResponse(200, updated));
    },
    dependencies,
  );

/**
 * Deletes an existing component record.
 *
 * @param request - Incoming request.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path.
 * @param dependencies - Handler dependencies (authenticate, store, publish).
 * @returns 204 with no body, 400 for an invalid id, 404 when disabled, the type is invalid, or the record is missing.
 */
export const deleteComponent = async (
  request: Request,
  type: string,
  id: string,
  dependencies: ComponentApiDependencies,
): Promise<Response> =>
  handler(
    request,
    false,
    undefined,
    async ({ store }) => {
      const validType = validateType(type);
      if (!validType.ok) {
        return validType.error;
      }
      const validId = validateId(id);
      if (!validId.ok) {
        return validId.error;
      }
      const removed = await store.remove(validType.type, validId.id);
      return fromStoreResult(removed, () => new Response(null, { status: 204 }));
    },
    dependencies,
  );

/**
 * Publishes component source code and optional files as a repository bundle.
 *
 * @param request - JSON request containing bundle code and optional additional files.
 * @param dependencies - Handler dependencies (authenticate, store, publish).
 * @returns 200 with the published bundle reference, 400 for malformed input or a rejected bundle, 500 for a repository failure.
 */
export const publishComponentSource = async (
  request: Request,
  dependencies: ComponentApiDependencies,
): Promise<Response> =>
  toResponse(async () => {
    const guarded = await guardRequest(request, true, dependencies);
    if (guarded !== undefined) {
      return guarded;
    }
    const body = await readBody(request, PublishRequestSchema);
    if (!body.ok) {
      return body.error;
    }
    const published = await dependencies.publish(publishBundle(body.body));
    if (!published.success) {
      return httpPublishError(published.error);
    }
    return publishResponse();
  });
