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
  ComponentRecordSchema,
  type ComponentType,
  type CreateComponentRequestSchema,
  type UpdateComponentRequestSchema,
} from './fields.utils';
import { FileSync, type FileSyncService } from './file-sync';
import {
  ComponentRepo,
  type ComponentRepoConfig,
  type ComponentRepoService,
  isSafeRelativePath,
} from './repo';

type ComponentRecord = Schema.Schema.Type<typeof ComponentRecordSchema>;

/** Error emitted when component record storage cannot complete. */
export class ComponentStoreError extends Data.TaggedError('ComponentStoreError')<{
  message: string;
  cause?: unknown;
  reason: 'NotFound' | 'Storage';
}> {}

/** Component storage operations backed by the configured component repository. */
export interface ComponentStoreService {
  /** Lists valid persisted records for a component type, silently skipping malformed files. */
  readonly list: (
    type: ComponentType,
  ) => Effect.Effect<ReadonlyArray<ComponentRecord>, ComponentStoreError>;
  /** Retrieves one persisted component record. */
  readonly get: (
    type: ComponentType,
    id: string,
  ) => Effect.Effect<ComponentRecord, ComponentStoreError>;
  /** Creates and durably stores a new component record; the server assigns its id and dates. */
  readonly create: (
    type: ComponentType,
    request: Schema.Schema.Type<typeof CreateComponentRequestSchema>,
  ) => Effect.Effect<ComponentRecord, ComponentStoreError>;
  /** Replaces an existing component record while preserving its creation date. */
  readonly update: (
    type: ComponentType,
    id: string,
    request: Schema.Schema.Type<typeof UpdateComponentRequestSchema>,
  ) => Effect.Effect<ComponentRecord, ComponentStoreError>;
  /** Removes an existing component record and synchronizes its containing directory. */
  readonly delete: (type: ComponentType, id: string) => Effect.Effect<void, ComponentStoreError>;
}

/** Service tag and layer factory for repository-backed component record storage. */
const ComponentStoreTag = Context.GenericTag<ComponentStoreService>('@login-app/ComponentStore');

/** Component record storage service. */
export const ComponentStore = Object.assign(ComponentStoreTag, {
  /** Creates a component store layer over a configured ComponentRepo tracked subtree. */
  layer: (
    config: ComponentRepoConfig,
  ): Layer.Layer<
    ComponentStoreService,
    never,
    FileSystem.FileSystem | FileSyncService | ComponentRepoService
  > => makeComponentStoreLayer(config),
});

/** Joins path segments with one slash between normalized boundaries. */
const joinPath = (...segments: ReadonlyArray<string>): string =>
  segments
    .map((segment, index) =>
      index === 0 ? segment.replace(/\/+$/, '') : segment.replace(/^\/+|\/+$/g, ''),
    )
    .join('/');

/** Identifies filesystem and repository failures that represent missing records. */
const isNotFound = (cause: unknown): boolean =>
  typeof cause === 'object' &&
  cause !== null &&
  (('code' in cause && cause.code === 'ENOENT') ||
    ('reason' in cause && cause.reason === 'NotFound'));

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

/** Parses and validates serialized component-record JSON. */
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
    Effect.all([FileSystem.FileSystem, FileSync, ComponentRepo]).pipe(
      Effect.map(([fileSystem, fileSync, repo]) => {
        const trackedRoot = joinPath(config.repoDir, config.trackedSubpath);

        const get = (type: ComponentType, id: string) =>
          recordPath(trackedRoot, type, id).pipe(
            Effect.flatMap(({ finalPath }) =>
              fileSystem.readFileString(finalPath).pipe(
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
                Effect.flatMap((content) =>
                  decodeRecord(content, `Unable to decode component: ${type}/${id}`),
                ),
              ),
            ),
          );

        const write = (type: ComponentType, id: string, record: ComponentRecord) =>
          recordPath(trackedRoot, type, id).pipe(
            Effect.flatMap(({ relPath }) =>
              Schema.encode(ComponentRecordSchema)(record).pipe(
                Effect.catchAll((cause) =>
                  Effect.fail(
                    new ComponentStoreError({
                      reason: 'Storage',
                      message: 'Unable to encode component record',
                      cause,
                    }),
                  ),
                ),
                Effect.flatMap((encoded) =>
                  repo.saveArtifacts([{ relPath, content: JSON.stringify(encoded) }]).pipe(
                    Effect.catchAll((cause) =>
                      Effect.fail(
                        new ComponentStoreError({
                          reason: 'Storage',
                          message: 'Unable to save component record',
                          cause,
                        }),
                      ),
                    ),
                    Effect.as(record),
                  ),
                ),
              ),
            ),
          );

        return {
          list: (type: ComponentType) => {
            const directory = joinPath(trackedRoot, type);
            return fileSystem.readDirectory(directory).pipe(
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
              Effect.map((entries) => entries.filter((entry) => entry.endsWith('.json'))),
              Effect.flatMap((entries) =>
                Effect.forEach(entries, (entry) =>
                  fileSystem.readFileString(joinPath(directory, entry)).pipe(
                    Effect.flatMap((content) =>
                      decodeRecord(content, `Unable to decode component: ${type}/${entry}`),
                    ),
                    Effect.either,
                  ),
                ),
              ),
              Effect.map((results) =>
                results.flatMap((result) => (result._tag === 'Right' ? [result.right] : [])),
              ),
            );
          },
          get,
          create: (type: ComponentType, request) =>
            Effect.sync(randomUUID).pipe(
              Effect.flatMap((id) => {
                const now = new Date().toISOString();
                return write(type, id, {
                  id,
                  src: request.src,
                  ...(request.json === undefined ? {} : { json: request.json }),
                  meta: { ...request.meta, createdDate: now, modifiedDate: now },
                });
              }),
            ),
          update: (type: ComponentType, id: string, request) =>
            get(type, id).pipe(
              Effect.flatMap((existing) =>
                write(type, id, {
                  id,
                  src: request.src,
                  ...(request.json === undefined ? {} : { json: request.json }),
                  meta: {
                    ...request.meta,
                    createdDate: existing.meta.createdDate,
                    modifiedDate: new Date().toISOString(),
                  },
                }),
              ),
            ),
          delete: (type: ComponentType, id: string) =>
            get(type, id).pipe(
              Effect.flatMap(() => recordPath(trackedRoot, type, id)),
              Effect.flatMap(({ directory, finalPath }) =>
                fileSystem.remove(finalPath).pipe(
                  Effect.catchAll((cause) =>
                    Effect.fail(
                      new ComponentStoreError({
                        reason: 'Storage',
                        message: `Unable to delete component: ${type}/${id}`,
                        cause,
                      }),
                    ),
                  ),
                  Effect.flatMap(() => fileSync.syncDirectory(directory).pipe(
                    Effect.catchAll((cause) =>
                      Effect.fail(
                        new ComponentStoreError({
                          reason: 'Storage',
                          message: 'Unable to synchronize component directory',
                          cause,
                        }),
                      ),
                    ),
                  )),
                ),
              ),
            ),
        };
      }),
    ),
  );
