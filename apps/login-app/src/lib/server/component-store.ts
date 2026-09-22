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
  /**
   * Lists valid persisted records for a component type, silently skipping malformed files.
   *
   * @param type - Component type whose records should be listed.
   * @returns An effect with the valid persisted records.
   * @throws {ComponentStoreError} When the type is invalid or the directory cannot be read.
   */
  readonly list: (
    type: string,
  ) => Effect.Effect<ReadonlyArray<ComponentRecord>, ComponentStoreError>;
  /**
   * Retrieves one persisted component record.
   *
   * @param type - Component type containing the record.
   * @param id - Component UUID identifying the record.
   * @returns An effect with the persisted record.
   * @throws {ComponentStoreError} When validation, reading, or decoding fails.
   */
  readonly get: (type: string, id: string) => Effect.Effect<ComponentRecord, ComponentStoreError>;
  /**
   * Creates and durably stores a new component record.
   *
   * @param type - Component type that will contain the new record.
   * @param request - Client-editable component fields to persist.
   * @returns An effect with the created record.
   * @throws {ComponentStoreError} When the type is invalid or persistence fails.
   */
  readonly create: (
    type: string,
    request: Schema.Schema.Type<typeof CreateComponentRequestSchema>,
  ) => Effect.Effect<ComponentRecord, ComponentStoreError>;
  /**
   * Replaces an existing component record while preserving its creation date.
   *
   * @param type - Component type containing the record.
   * @param id - Component UUID identifying the record.
   * @param request - Client-editable replacement fields to persist.
   * @returns An effect with the updated record.
   * @throws {ComponentStoreError} When validation, retrieval, or persistence fails.
   */
  readonly update: (
    type: string,
    id: string,
    request: Schema.Schema.Type<typeof UpdateComponentRequestSchema>,
  ) => Effect.Effect<ComponentRecord, ComponentStoreError>;
  /**
   * Removes an existing component record and synchronizes its containing directory.
   *
   * @param type - Component type containing the record.
   * @param id - Component UUID identifying the record.
   * @returns An effect that completes after deletion and directory synchronization.
   * @throws {ComponentStoreError} When validation, retrieval, deletion, or synchronization fails.
   */
  readonly delete: (type: string, id: string) => Effect.Effect<void, ComponentStoreError>;
}

/** Service tag and layer factory for repository-backed component record storage. */
const ComponentStoreTag = Context.GenericTag<ComponentStoreService>('@login-app/ComponentStore');

/** Component record storage service. */
export const ComponentStore = Object.assign(ComponentStoreTag, {
  /**
   * Creates a component store over a configured ComponentRepo tracked subtree.
   *
   * @param config - Repository root and tracked subtree for component records.
   * @returns A component store layer requiring filesystem, sync, and repository services.
   */
  layer: (
    config: ComponentRepoConfig,
  ): Layer.Layer<
    ComponentStoreService,
    never,
    FileSystem.FileSystem | FileSyncService | ComponentRepoService
  > => makeComponentStoreLayer(config),
});

/**
 * Joins path segments with one slash between normalized boundaries.
 *
 * @param segments - Path segments to join.
 * @returns The normalized slash-delimited path.
 */
const joinPath = (...segments: ReadonlyArray<string>): string =>
  segments
    .map((segment, index) =>
      index === 0 ? segment.replace(/\/+$/, '') : segment.replace(/^\/+|\/+$/g, ''),
    )
    .join('/');

/**
 * Identifies filesystem and repository failures that represent missing records.
 *
 * @param cause - Failure cause to inspect.
 * @returns Whether the cause represents a missing file or record.
 */
const isNotFound = (cause: unknown): boolean =>
  typeof cause === 'object' &&
  cause !== null &&
  (('code' in cause && cause.code === 'ENOENT') ||
    ('reason' in cause && cause.reason === 'NotFound'));

/**
 * Decodes a supported component type or fails with a tagged invalid-type error.
 *
 * @param type - Untrusted component type to validate.
 * @returns An effect with the validated component type.
 * @throws {ComponentStoreError} When the type is unsupported.
 */
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

/**
 * Decodes a component UUID or fails with a tagged invalid-id error.
 *
 * @param id - Untrusted component id to validate.
 * @returns An effect with the validated component id.
 * @throws {ComponentStoreError} When the id is not a supported component UUID.
 */
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

/**
 * Builds a safe repository path for a validated component record.
 *
 * @param trackedRoot - Root of the configured tracked component subtree.
 * @param type - Validated component type containing the record.
 * @param id - Validated component UUID identifying the record.
 * @returns An effect with the artifact's relative path, final path, and containing directory.
 * @throws {ComponentStoreError} When the generated storage path is unsafe.
 */
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

/**
 * Parses and validates serialized component-record JSON.
 *
 * @param content - Serialized component record to decode.
 * @param message - Human-readable failure message for an invalid record.
 * @returns An effect with the decoded component record.
 * @throws {ComponentStoreError} When the content is not a valid component record.
 */
const decodeRecord = (content: string, message: string) =>
  Schema.decodeUnknown(Schema.parseJson(ComponentRecordSchema))(content).pipe(
    Effect.catchAll((cause) =>
      Effect.fail(new ComponentStoreError({ reason: 'Storage', message, cause })),
    ),
  );

/**
 * Builds the ComponentStore layer. List deliberately skips malformed JSON artifacts without logging.
 *
 * @param config - Repository root and tracked subtree for component records.
 * @returns A layer requiring filesystem, sync, and repository services.
 */
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
