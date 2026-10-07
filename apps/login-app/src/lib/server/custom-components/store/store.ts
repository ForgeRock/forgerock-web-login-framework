/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { FileSystem, Path } from '@effect/platform';
import { Context, Data, Effect, Layer, Schema } from 'effect';
import { randomUUID } from 'node:crypto';

import {
  ComponentRecordSchema,
  type ComponentType,
  type CreateComponentRequest,
  type UpdateComponentRequest,
} from '../api.schemas';
import { type ComponentLogger, type ComponentStoreConfig, Log } from '../shared';
import { isSafeRelativePath } from '../writer/paths';
import { FileSync, Writer } from '../writer/writer';

import type { ArtifactWriterFn, FileSyncService } from '../writer/writer';

/** A component storage failure raised when a record cannot be located. */
export class StoreNotFoundError extends Data.TaggedError('StoreNotFoundError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/** A component storage failure raised when a record cannot be read, written, or deleted. */
export class StoreStorageError extends Data.TaggedError('StoreStorageError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/** A component storage failure carried on the Effect error channel. */
export type ComponentStoreError = StoreNotFoundError | StoreStorageError;

/** The component record storage API. */
export interface ComponentStoreApi {
  readonly list: (
    type: ComponentType,
  ) => Effect.Effect<ReadonlyArray<typeof ComponentRecordSchema.Type>, ComponentStoreError>;
  readonly get: (
    type: ComponentType,
    id: string,
  ) => Effect.Effect<typeof ComponentRecordSchema.Type, ComponentStoreError>;
  readonly create: (
    type: ComponentType,
    request: CreateComponentRequest,
  ) => Effect.Effect<typeof ComponentRecordSchema.Type, ComponentStoreError>;
  readonly update: (
    type: ComponentType,
    id: string,
    request: UpdateComponentRequest,
  ) => Effect.Effect<typeof ComponentRecordSchema.Type, ComponentStoreError>;
  readonly remove: (type: ComponentType, id: string) => Effect.Effect<void, ComponentStoreError>;
}

/** Service tag for component record storage; layers provide implementations. */
export const Store = Context.GenericTag<ComponentStoreApi>('Store');

/**
 * Component storage operations backed by the configured component repository. List
 * skips malformed JSON artifacts and logs a warning for each one.
 *
 * @param config - Tracked config directory configuration.
 * @returns A layer providing the record store, requiring the platform FileSystem, the writer, fsync, and log services.
 */
export const StoreLive = (
  config: ComponentStoreConfig,
): Layer.Layer<
  ComponentStoreApi,
  never,
  FileSystem.FileSystem | Path.Path | ArtifactWriterFn | FileSyncService | ComponentLogger
> =>
  Layer.effect(
    Store,
    Effect.gen(function* () {
      const fileSystem = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const writer = yield* Writer;
      const fileSync = yield* FileSync;
      const log = yield* Log;

      const trackedRoot = config.trackedRoot;

      const writeRecord = (
        type: ComponentType,
        id: string,
        record: ComponentRecord,
      ): Effect.Effect<ComponentRecord, ComponentStoreError> =>
        writer([
          {
            relPath: `${type}/${id}.json`,
            content: Schema.encodeSync(Schema.parseJson(ComponentRecordSchema))(record),
          },
        ]).pipe(
          Effect.mapError(
            (cause) => new StoreStorageError({ message: 'Unable to save component record', cause }),
          ),
          Effect.as(record),
        );

      const readRecord = (
        type: ComponentType,
        id: string,
      ): Effect.Effect<ComponentRecord, ComponentStoreError> => {
        const filePath = recordPath(path, trackedRoot, type, id);
        if (filePath === undefined) {
          return Effect.fail(
            new StoreStorageError({ message: `Unsafe component storage path: ${type}/${id}` }),
          );
        }
        return fileSystem.readFileString(filePath).pipe(
          Effect.mapError((cause) =>
            cause._tag === 'SystemError' && cause.reason === 'NotFound'
              ? new StoreNotFoundError({ message: `Component not found: ${type}/${id}`, cause })
              : new StoreStorageError({
                  message: `Unable to read component: ${type}/${id}`,
                  cause,
                }),
          ),
          Effect.flatMap(decodeRecord(`Unable to decode component: ${type}/${id}`)),
        );
      };

      const readDirectoryEntries =
        (directory: string, type: ComponentType) => (entries: ReadonlyArray<string>) =>
          Effect.forEach(entries, (entry) =>
            Effect.map(
              Effect.either(
                fileSystem.readFileString(`${directory}/${entry}`).pipe(
                  Effect.mapError(
                    (cause) =>
                      new StoreStorageError({
                        message: `Unable to decode component: ${type}/${entry}`,
                        cause,
                      }),
                  ),
                  Effect.flatMap(decodeRecord(`Unable to decode component: ${type}/${entry}`)),
                ),
              ),
              (either) => ({ entry, either }),
            ),
          );

      return {
        list: (type) => {
          const directory = path.join(trackedRoot, type);
          return fileSystem.readDirectory(directory).pipe(
            Effect.mapError((cause) =>
              cause._tag === 'SystemError' && cause.reason === 'NotFound'
                ? new StoreNotFoundError({ message: `No components directory: ${type}`, cause })
                : new StoreStorageError({ message: `Unable to list components: ${type}`, cause }),
            ),
            Effect.catchAll((error) =>
              error._tag === 'StoreNotFoundError' ? Effect.succeed([]) : Effect.fail(error),
            ),
            Effect.map((entries) => entries.filter((entry) => entry.endsWith('.json'))),
            Effect.flatMap(readDirectoryEntries(directory, type)),
            Effect.map((decoded) => {
              const records: Array<ComponentRecord> = [];
              for (const { entry, either } of decoded) {
                if (either._tag === 'Right') {
                  records.push(either.right);
                } else {
                  log.warn('[components] skipped unreadable record', {
                    path: `${type}/${entry}`,
                  });
                }
              }
              return records;
            }),
          );
        },

        get: (type, id) => readRecord(type, id),

        create: (type, request) => {
          const id = randomUUID();
          const now = new Date().toISOString();
          return writeRecord(type, id, {
            id,
            src: request.src,
            ...(request.json === undefined ? {} : { json: request.json }),
            meta: { ...request.meta, createdDate: now, modifiedDate: now },
          });
        },

        update: (type, id, request) =>
          Effect.flatMap(readRecord(type, id), (existing) =>
            writeRecord(type, id, {
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

        remove: (type, id) => {
          const filePath = recordPath(path, trackedRoot, type, id);
          if (filePath === undefined) {
            return Effect.fail(
              new StoreStorageError({ message: `Unsafe component storage path: ${type}/${id}` }),
            );
          }
          return readRecord(type, id).pipe(
            Effect.flatMap(() =>
              fileSystem.remove(filePath).pipe(
                Effect.mapError(
                  (cause) =>
                    new StoreStorageError({
                      message: `Unable to delete component: ${type}/${id}`,
                      cause,
                    }),
                ),
              ),
            ),
            Effect.flatMap(() =>
              Effect.mapError(
                fileSync.fsync(path.join(trackedRoot, type)),
                (cause) =>
                  new StoreStorageError({
                    message: 'Unable to synchronize component directory',
                    cause,
                  }),
              ),
            ),
            Effect.asVoid,
          );
        },
      };
    }),
  );

type ComponentRecord = typeof ComponentRecordSchema.Type;

/** Builds a safe repository path for a component record. */
const recordPath = (path: Path.Path, trackedRoot: string, type: ComponentType, id: string) => {
  const relPath = `${type}/${id}.json`;
  if (!isSafeRelativePath(relPath)) {
    return undefined;
  }
  return path.join(trackedRoot, relPath);
};

/** Parses and validates serialized component-record JSON, replacing bare JSON.parse. */
const decodeRecord = (message: string) => (content: string) =>
  Effect.mapError(
    Schema.decodeUnknown(Schema.parseJson(ComponentRecordSchema))(content),
    (cause) => new StoreStorageError({ message, cause }),
  );
