/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect } from 'effect';

import { pickFields } from '../fields.utilities';
import { type ComponentLogger, Log } from '../log';
import { BUNDLE_ENTRY_PATH, Publish } from '../publish/publish';
import { Store } from '../store/store';
import { auditMutation, guardRequest, readBody } from './api.effects';
import {
  CreateComponentRequestSchema,
  HttpError,
  PublishRequestSchema,
  UpdateComponentRequestSchema,
} from './api.schemas';
import {
  causeDetails,
  parseFields,
  recordResponse,
  toResponse,
  translateStoreErrors,
  validateId,
  validateType,
} from './api.utilities';

import type { AuthService } from '../auth/auth';
import type { PublishService } from '../publish/publish';
import type { ComponentStoreApi } from '../store/store';

/**
 * Lists component records for a route type, projecting fields from the `?fields=` query parameter.
 *
 * @param request - Incoming request with an optional `fields` query parameter.
 * @param type - Component category from the route path.
 * @returns 200 with the picked records, 400 for invalid fields, 404 when disabled or the type is invalid.
 */
export const listComponents = (
  request: Request,
  type: string,
): Effect.Effect<Response, never, AuthService | ComponentLogger | ComponentStoreApi> =>
  toResponse(
    Effect.gen(function* () {
      yield* guardRequest(request);
      const validType = yield* validateType(type);
      const fields = yield* parseFields(request);
      const store = yield* Store;
      const records = yield* translateStoreErrors(store.list(validType));
      const body = records.map((record) => pickFields(record, fields));
      return Response.json(body, { headers: { 'cache-control': 'no-store' } });
    }),
  );

/**
 * Retrieves a component record by its route type and id.
 *
 * @param request - Incoming request.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path.
 * @returns 200 with the record, 400 for an invalid id, 404 when disabled, the type is invalid, or the record is missing.
 */
export const getComponent = (
  request: Request,
  type: string,
  id: string,
): Effect.Effect<Response, never, AuthService | ComponentLogger | ComponentStoreApi> =>
  toResponse(
    Effect.gen(function* () {
      yield* guardRequest(request);
      const validType = yield* validateType(type);
      const validId = yield* validateId(id);
      const store = yield* Store;
      const found = yield* translateStoreErrors(store.get(validType, validId));
      return recordResponse(200, found);
    }),
  );

/**
 * Creates a component record in the requested route type; the server assigns its id and dates.
 *
 * @param request - JSON request containing the client-editable component fields.
 * @param type - Component category from the route path.
 * @returns 201 with the created record; 400 for malformed input, 404 when disabled or the type is invalid.
 */
export const createComponent = (
  request: Request,
  type: string,
): Effect.Effect<Response, never, AuthService | ComponentLogger | ComponentStoreApi> =>
  toResponse(
    Effect.gen(function* () {
      const user = yield* guardRequest(request);
      const body = yield* readBody(request, CreateComponentRequestSchema);
      const log = yield* Log;
      const validType = yield* validateType(type);
      const store = yield* Store;
      const created = yield* translateStoreErrors(
        auditMutation(
          log,
          { action: 'create', uid: user.uid, type: validType },
          store.create(validType, body),
          (created) => ({ id: created.id, name: created.meta.name }),
        ),
      );
      return recordResponse(201, created);
    }),
  );

/**
 * Updates an existing component record, preserving its creation date.
 * A body id, when present, must match the route id.
 *
 * @param request - JSON request containing the replacement client-editable component fields.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path.
 * @returns 200 with the updated record, 400 for malformed input or a mismatched body id, 404 when disabled, the type is invalid, or the record is missing.
 */
export const updateComponent = (
  request: Request,
  type: string,
  id: string,
): Effect.Effect<Response, never, AuthService | ComponentLogger | ComponentStoreApi> =>
  toResponse(
    Effect.gen(function* () {
      const user = yield* guardRequest(request);
      const body = yield* readBody(request, UpdateComponentRequestSchema);
      const log = yield* Log;
      const validType = yield* validateType(type);
      const validId = yield* validateId(id);
      if (body.id !== undefined && body.id !== validId) {
        return yield* Effect.fail(
          new HttpError({ status: 400, message: 'Body id does not match the URL' }),
        );
      }
      const store = yield* Store;
      const updated = yield* translateStoreErrors(
        auditMutation(
          log,
          { action: 'update', uid: user.uid, type: validType, id: validId },
          store.update(validType, validId, body),
          (updated) => ({ name: updated.meta.name }),
        ),
      );
      return recordResponse(200, updated);
    }),
  );

/**
 * Deletes an existing component record.
 *
 * @param request - Incoming request.
 * @param type - Component category from the route path.
 * @param id - Component UUID from the route path.
 * @returns 204 with no body, 400 for an invalid id, 404 when disabled, the type is invalid, or the record is missing.
 */
export const deleteComponent = (
  request: Request,
  type: string,
  id: string,
): Effect.Effect<Response, never, AuthService | ComponentLogger | ComponentStoreApi> =>
  toResponse(
    Effect.gen(function* () {
      const { uid } = yield* guardRequest(request);
      const log = yield* Log;
      const validType = yield* validateType(type);
      const validId = yield* validateId(id);
      const store = yield* Store;
      yield* translateStoreErrors(
        auditMutation(
          log,
          { action: 'delete', uid, type: validType, id: validId },
          store.remove(validType, validId),
        ),
      );
      return new Response(null, { status: 204 });
    }),
  );

/**
 * Publishes component source code as a repository bundle.
 *
 * @param request - JSON request containing the bundle code.
 * @returns 204 with no body — the bundle is persisted to the component repository and served through the separate publish channel; 400 for malformed input, 500 for a repository failure.
 */
export const publishComponent = (
  request: Request,
): Effect.Effect<Response, never, AuthService | ComponentLogger | PublishService> =>
  toResponse(
    Effect.gen(function* () {
      const user = yield* guardRequest(request);
      const body = yield* readBody(request, PublishRequestSchema);
      const log = yield* Log;
      const paths = [BUNDLE_ENTRY_PATH];
      const publisher = yield* Publish;
      return yield* publisher.publish(body).pipe(
        Effect.catchTag('PublishStorageError', (error) =>
          Effect.tapError(Effect.fail(new HttpError({ status: 500, message: error.message })), () =>
            Effect.sync(() =>
              log.error(
                '[components] audit',
                {
                  action: 'publish',
                  outcome: 'failed',
                  uid: user.uid,
                  paths,
                  detail: error.message,
                },
                ...causeDetails(error.cause),
              ),
            ),
          ),
        ),
        Effect.map(() => {
          log.info('[components] audit', {
            action: 'publish',
            outcome: 'succeeded',
            uid: user.uid,
            paths,
          });
          return new Response(null, { status: 204 });
        }),
      );
    }),
  );
