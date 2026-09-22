/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { FileSystem } from '@effect/platform';
import { Context, Data, Effect, Layer, Schema } from 'effect';
import { randomUUID } from 'node:crypto';

import {
  ComponentIdSchema,
  ComponentRecordSchema,
  type ComponentType,
  ComponentTypeSchema,
  type CreateComponentRequestSchema,
  type UpdateComponentRequestSchema,
} from './component-api';
import {
  ComponentRepo,
  type ComponentRepoConfig,
  type ComponentRepoService,
  FileSync,
  type FileSyncService,
  isSafeRelativePath,
} from './component-repo';

type ComponentRecord = Schema.Schema.Type<typeof ComponentRecordSchema>;

/** Error emitted when component record storage cannot complete. */
export class ComponentStoreError extends Data.TaggedError('ComponentStoreError')<{
  message: string;
  cause?: unknown;
  reason: 'NotFound' | 'InvalidType' | 'InvalidId' | 'Conflict' | 'Storage';
}> {}

/** Component storage operations backed by the configured component repository. */
export interface ComponentStoreService {
  /** Lists valid persisted records for a component type, silently skipping malformed files. */
  readonly list: (
    type: string,
  ) => Effect.Effect<ReadonlyArray<ComponentRecord>, ComponentStoreError>;
  /** Retrieves one persisted component record. */
  readonly get: (type: string, id: string) => Effect.Effect<ComponentRecord, ComponentStoreError>;
  /** Creates and durably stores a new component record. */
  readonly create: (
    type: string,
    request: Schema.Schema.Type<typeof CreateComponentRequestSchema>,
  ) => Effect.Effect<ComponentRecord, ComponentStoreError>;
  /** Replaces an existing component record while preserving its creation date. */
  readonly update: (
    type: string,
    id: string,
    request: Schema.Schema.Type<typeof UpdateComponentRequestSchema>,
  ) => Effect.Effect<ComponentRecord, ComponentStoreError>;
  /** Removes an existing component record and synchronizes its containing directory. */
  readonly delete: (type: string, id: string) => Effect.Effect<void, ComponentStoreError>;
}

/** Service tag and layer factory for repository-backed component record storage. */
const ComponentStoreTag = Context.GenericTag<ComponentStoreService>('@login-app/ComponentStore');

/** Component record storage service. */
export const ComponentStore = Object.assign(ComponentStoreTag, {
  /** Creates a component store over a configured ComponentRepo tracked subtree. */
  layer: (
    config: ComponentRepoConfig,
  ): Layer.Layer<
    ComponentStoreService,
    never,
    FileSystem.FileSystem | FileSyncService | ComponentRepoService
  > => makeComponentStoreLayer(config),
});

const joinPath = (...segments: ReadonlyArray<string>): string =>
  segments
    .map((segment, index) =>
      index === 0 ? segment.replace(/\/+$/, '') : segment.replace(/^\/+|\/+$/g, ''),
    )
    .join('/');

const isNotFound = (cause: unknown): boolean =>
  typeof cause === 'object' &&
  cause !== null &&
  (('code' in cause && cause.code === 'ENOENT') ||
    ('reason' in cause && cause.reason === 'NotFound'));

/** Decodes a supported component type or fails with a tagged invalid-type error. */
const validateType = (type: string) =>
  Schema.decodeUnknown(ComponentTypeSchema)(type).pipe(
    Effect.catchAll((cause) =>
      Effect.fail(
        new ComponentStoreError({
          reason: 'InvalidType',
          message: `Invalid component type: ${type}`,
          cause,
        }),
      ),
    ),
  );

/** Decodes a component UUID or fails with a tagged invalid-id error. */
const validateId = (id: string) =>
  Schema.decodeUnknown(ComponentIdSchema)(id).pipe(
    Effect.catchAll((cause) =>
      Effect.fail(
        new ComponentStoreError({
          reason: 'InvalidId',
          message: `Invalid component id: ${id}`,
          cause,
        }),
      ),
    ),
  );

/** Builds a safe repository path for a validated component record. */
const recordPath = (trackedRoot: string, type: ComponentType, id: string) => {
  const relPath = `${type}/${id}.json`;
  return isSafeRelativePath(relPath)
    ? Effect.succeed({
        directory: joinPath(trackedRoot, type),
        finalPath: joinPath(trackedRoot, relPath),
        relPath,
      })
    : Effect.fail(
        new ComponentStoreError({
          reason: 'Storage',
          message: `Unsafe component storage path: ${relPath}`,
        }),
      );
};

const decodeRecord = (content: string, message: string) =>
  Schema.decodeUnknown(Schema.parseJson(ComponentRecordSchema))(content).pipe(
    Effect.catchAll((cause) =>
      Effect.fail(new ComponentStoreError({ reason: 'Storage', message, cause })),
    ),
  );

/** Builds the ComponentStore layer. List deliberately skips malformed JSON artifacts without logging. */
const makeComponentStoreLayer = (
  config: ComponentRepoConfig,
): Layer.Layer<
  ComponentStoreService,
  never,
  FileSystem.FileSystem | FileSyncService | ComponentRepoService
> =>
  Layer.effect(
    ComponentStore,
    Effect.gen(function* () {
      const fileSystem = yield* FileSystem.FileSystem;
      const fileSync = yield* FileSync;
      const repo = yield* ComponentRepo;
      const trackedRoot = joinPath(config.repoDir, config.trackedSubpath);

      const get = (inputType: string, inputId: string) =>
        Effect.gen(function* () {
          const type = yield* validateType(inputType);
          const id = yield* validateId(inputId);
          const { finalPath } = yield* recordPath(trackedRoot, type, id);
          const content = yield* fileSystem.readFileString(finalPath).pipe(
            Effect.catchAll((cause) =>
              Effect.fail(
                new ComponentStoreError({
                  reason: isNotFound(cause) ? 'NotFound' : 'Storage',
                  message: isNotFound(cause)
                    ? `Component not found: ${type}/${id}`
                    : `Unable to read component: ${type}/${id}`,
                  cause,
                }),
              ),
            ),
          );
          return yield* decodeRecord(content, `Unable to decode component: ${type}/${id}`);
        });

      const write = (type: ComponentType, id: string, record: ComponentRecord) =>
        Effect.gen(function* () {
          const { relPath } = yield* recordPath(trackedRoot, type, id);
          const encoded = yield* Schema.encode(ComponentRecordSchema)(record).pipe(
            Effect.catchAll((cause) =>
              Effect.fail(
                new ComponentStoreError({
                  reason: 'Storage',
                  message: 'Unable to encode component record',
                  cause,
                }),
              ),
            ),
          );
          yield* repo.saveComponent(relPath, JSON.stringify(encoded)).pipe(
            Effect.catchAll((cause) =>
              Effect.fail(
                new ComponentStoreError({
                  reason: 'Storage',
                  message: 'Unable to save component record',
                  cause,
                }),
              ),
            ),
          );
          return record;
        });

      return {
        list: (inputType) =>
          Effect.gen(function* () {
            const type = yield* validateType(inputType);
            const directory = joinPath(trackedRoot, type);
            const entries = yield* fileSystem.readDirectory(directory).pipe(
              Effect.catchAll((cause) =>
                isNotFound(cause)
                  ? Effect.succeed([] as ReadonlyArray<string>)
                  : Effect.fail(
                      new ComponentStoreError({
                        reason: 'Storage',
                        message: `Unable to list components: ${type}`,
                        cause,
                      }),
                    ),
              ),
            );
            const records = yield* Effect.forEach(
              entries.filter((entry) => entry.endsWith('.json')),
              (entry) =>
                fileSystem.readFileString(joinPath(directory, entry)).pipe(
                  Effect.flatMap((content) =>
                    decodeRecord(content, `Unable to decode component: ${type}/${entry}`),
                  ),
                  Effect.either,
                ),
            );
            return records.flatMap((result) => (result._tag === 'Right' ? [result.right] : []));
          }),
        get,
        create: (inputType, request) =>
          Effect.gen(function* () {
            const type = yield* validateType(inputType);
            const id = yield* Effect.sync(randomUUID);
            const now = new Date().toISOString();
            return yield* write(type, id, {
              id,
              src: request.src,
              ...(request.json === undefined ? {} : { json: request.json }),
              meta: { ...request.meta, createdDate: now, modifiedDate: now },
            });
          }),
        update: (inputType, inputId, request) =>
          Effect.gen(function* () {
            const type = yield* validateType(inputType);
            const id = yield* validateId(inputId);
            const existing = yield* get(type, id);
            return yield* write(type, id, {
              id,
              src: request.src,
              ...(request.json === undefined ? {} : { json: request.json }),
              meta: {
                ...request.meta,
                createdDate: existing.meta.createdDate,
                modifiedDate: new Date().toISOString(),
              },
            });
          }),
        delete: (inputType, inputId) =>
          Effect.gen(function* () {
            const type = yield* validateType(inputType);
            const id = yield* validateId(inputId);
            yield* get(type, id);
            const { directory, finalPath } = yield* recordPath(trackedRoot, type, id);
            yield* fileSystem.remove(finalPath).pipe(
              Effect.catchAll((cause) =>
                Effect.fail(
                  new ComponentStoreError({
                    reason: 'Storage',
                    message: `Unable to delete component: ${type}/${id}`,
                    cause,
                  }),
                ),
              ),
            );
            yield* fileSync.syncDirectory(directory).pipe(
              Effect.catchAll((cause) =>
                Effect.fail(
                  new ComponentStoreError({
                    reason: 'Storage',
                    message: 'Unable to synchronize component directory',
                    cause,
                  }),
                ),
              ),
            );
          }),
      };
    }),
  );

/** Retrieves the ComponentStore service from the current Effect environment. */
export const componentStore = ComponentStore;
