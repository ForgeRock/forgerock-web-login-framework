/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { FileSystem, Path } from '@effect/platform';
import { Array, Context, Data, DateTime, Effect, Either, Layer, Schema } from 'effect';
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

/** Parses and validates serialized component-record JSON. */
const decodeRecord = (content: string) =>
  Effect.catchTag(
    Schema.decodeUnknown(Schema.parseJson(ComponentRecordSchema))(content),
    'ParseError',
    (cause) => new StoreStorageError({ message: 'Unable to decode component record', cause }),
  );

/** Builds a safe repository path for a component record. */
const recordPath = (path: Path.Path, trackedRoot: string, type: ComponentType, id: string) => {
  const relPath = `${type}/${id}.json`;
  if (!isSafeRelativePath(relPath)) {
    return undefined;
  }
  return path.join(trackedRoot, relPath);
};

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

      /** Serializes an already-validated record for the writer; encoding adds no validation. */
      const encodeRecord = (record: typeof ComponentRecordSchema.Type): string =>
        JSON.stringify(record);

      const writeRecord = (
        type: ComponentType,
        id: string,
        record: typeof ComponentRecordSchema.Type,
      ): Effect.Effect<typeof ComponentRecordSchema.Type, ComponentStoreError> =>
        writer
          .write([
            {
              relPath: `${type}/${id}.json`,
              content: encodeRecord(record),
            },
          ])
          .pipe(
            Effect.mapError(
              (cause) =>
                new StoreStorageError({ message: 'Unable to save component record', cause }),
            ),
            Effect.as(record),
          );

      const readRecord = (
        type: ComponentType,
        id: string,
      ): Effect.Effect<typeof ComponentRecordSchema.Type, ComponentStoreError> => {
        const filePath = recordPath(path, trackedRoot, type, id);
        if (filePath === undefined) {
          return Effect.fail(
            new StoreStorageError({ message: `Unsafe component storage path: ${type}/${id}` }),
          );
        }
        return fileSystem.readFileString(filePath).pipe(
          Effect.catchTags({
            SystemError: (cause) =>
              cause.reason === 'NotFound'
                ? Effect.fail(
                    new StoreNotFoundError({
                      message: `Component not found: ${type}/${id}`,
                      cause,
                    }),
                  )
                : Effect.fail(
                    new StoreStorageError({
                      message: `Unable to read component: ${type}/${id}`,
                      cause,
                    }),
                  ),
            BadArgument: (cause) =>
              Effect.fail(
                new StoreStorageError({
                  message: `Unable to read component: ${type}/${id}`,
                  cause,
                }),
              ),
          }),
          Effect.flatMap(decodeRecord),
        );
      };

      /** Reads one directory entry, tagging read and decode failures for the list projection. */
      const readEntry = (directory: string, type: ComponentType) => (entry: string) =>
        fileSystem.readFileString(`${directory}/${entry}`).pipe(
          Effect.catchTags({
            SystemError: (cause) =>
              Effect.fail(
                new StoreStorageError({
                  message: `Unable to decode component: ${type}/${entry}`,
                  cause,
                }),
              ),
            BadArgument: (cause) =>
              Effect.fail(
                new StoreStorageError({
                  message: `Unable to decode component: ${type}/${entry}`,
                  cause,
                }),
              ),
          }),
          Effect.flatMap(decodeRecord),
        );

      return {
        list: (type) => {
          const directory = path.join(trackedRoot, type);
          return fileSystem.readDirectory(directory).pipe(
            Effect.catchTags({
              SystemError: (cause) =>
                cause.reason === 'NotFound'
                  ? Effect.fail(
                      new StoreNotFoundError({
                        message: `No components directory: ${type}`,
                        cause,
                      }),
                    )
                  : Effect.fail(
                      new StoreStorageError({
                        message: `Unable to list components: ${type}`,
                        cause,
                      }),
                    ),
              BadArgument: (cause) =>
                Effect.fail(
                  new StoreStorageError({
                    message: `Unable to list components: ${type}`,
                    cause,
                  }),
                ),
            }),
            Effect.catchTag('StoreNotFoundError', () => Effect.succeed([] as Array<string>)),
            Effect.map((entries) => entries.filter((entry) => entry.endsWith('.json'))),
            Effect.flatMap((entries) =>
              Effect.forEach(entries, (entry) =>
                readEntry(
                  directory,
                  type,
                )(entry).pipe(
                  Effect.either,
                  Effect.map((either) => ({ entry, either })),
                ),
              ),
            ),
            Effect.map((decoded) => {
              const [failed, records] = Array.partitionMap(decoded, ({ entry, either }) =>
                Either.mapLeft(either, () => entry),
              );
              for (const entry of failed) {
                log.warn('[components] skipped unreadable record', {
                  path: `${type}/${entry}`,
                });
              }
              return records;
            }),
          );
        },

        get: (type, id) => readRecord(type, id),

        create: (type, request) =>
          Effect.flatMap(DateTime.now, (now) => {
            const id = randomUUID();
            const timestamp = DateTime.formatIso(now);
            return writeRecord(type, id, {
              id,
              src: request.src,
              ...(request.json === undefined ? {} : { json: request.json }),
              meta: { ...request.meta, createdDate: timestamp, modifiedDate: timestamp },
            });
          }),

        update: (type, id, request) =>
          Effect.flatMap(DateTime.now, (now) =>
            Effect.flatMap(readRecord(type, id), (existing) =>
              writeRecord(type, id, {
                id,
                src: request.src,
                ...(request.json === undefined ? {} : { json: request.json }),
                meta: {
                  ...request.meta,
                  createdDate: existing.meta.createdDate,
                  modifiedDate: DateTime.formatIso(now),
                },
              }),
            ),
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
                Effect.catchTags({
                  SystemError: (cause) =>
                    Effect.fail(
                      new StoreStorageError({
                        message: `Unable to delete component: ${type}/${id}`,
                        cause,
                      }),
                    ),
                  BadArgument: (cause) =>
                    Effect.fail(
                      new StoreStorageError({
                        message: `Unable to delete component: ${type}/${id}`,
                        cause,
                      }),
                    ),
                }),
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
