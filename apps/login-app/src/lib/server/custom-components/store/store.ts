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
} from '../api/api.schemas';
import { type ComponentLogger, Log } from '../log';
import { componentConfigDir } from '../settings';
import { FileSync } from '../writer/file-sync';
import { catchFsErrors } from '../writer/fs-errors';
import { isSafeRelativePath } from '../writer/paths';
import { Writer } from '../writer/writer';

import type { FileSyncService } from '../writer/file-sync';
import type { WriterService } from '../writer/writer';

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
 * Parses and validates serialized component-record JSON:
 *
 *   content = '{"id":"u1","src":"<svelte>","meta":{...}}'
 *     → returns { id: 'u1', src: '<svelte>', meta: {...} }
 */
const decodeRecord = (content: string) =>
  Schema.decodeUnknown(Schema.parseJson(ComponentRecordSchema))(content).pipe(
    Effect.catchTag(
      'ParseError',
      (cause) => new StoreStorageError({ message: 'Unable to decode component record', cause }),
    ),
  );

/**
 * Component storage operations backed by the configured component repository. List
 * skips malformed JSON artifacts and logs a warning for each one.
 *
 * @returns A layer providing the record store, requiring the platform FileSystem, the writer, fsync, and log services.
 */
export const StoreLive: Layer.Layer<
  ComponentStoreApi,
  never,
  FileSystem.FileSystem | Path.Path | WriterService | FileSyncService | ComponentLogger
> = Layer.effect(
  Store,
  Effect.gen(function* () {
    const fileSystem = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const writer = yield* Writer;
    const fileSync = yield* FileSync;
    const log = yield* Log;
    const configDir = yield* componentConfigDir;

    /**
     * Resolves the safe repository path for a component record:
     *
     *   type = 'callbacks', id = '123e4567-…' → returns '<configDir>/callbacks/123e4567-….json'
     */
    const readRecordPath = (type: ComponentType, id: string) => {
      const relPath = `${type}/${id}.json`;
      if (!isSafeRelativePath(relPath)) {
        return undefined;
      }
      return path.join(configDir, relPath);
    };

    /**
     * Serializes a validated record back to file text — the inverse of `decodeRecord`,
     * through the same schema, so the on-disk format can never drift from the in-memory one:
     *
     *   record = { id: 'u1', src: '<svelte>', meta: {...} }
     *     → returns '{"id":"u1","src":"<svelte>","meta":{...}}'
     */
    const encodeRecord = Schema.encodeSync(Schema.parseJson(ComponentRecordSchema));

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
          Effect.catchTag('ArtifactWriterError', (cause) =>
            Effect.fail(
              new StoreStorageError({ message: 'Unable to save component record', cause }),
            ),
          ),
          Effect.as(record),
        );

    /**
     * Reads one record by id — the filename is assembled from the user-supplied id, so
     * the path is safety-checked and a missing file is a client-facing `StoreNotFoundError`:
     *
     *   type = 'callbacks', id = '123e4567-…' → reads <configDir>/callbacks/123e4567-….json
     */
    const readRecordById = (
      type: ComponentType,
      id: string,
    ): Effect.Effect<typeof ComponentRecordSchema.Type, ComponentStoreError> => {
      const filePath = readRecordPath(type, id);
      if (filePath === undefined) {
        return Effect.fail(
          new StoreStorageError({ message: `Unsafe component storage path: ${type}/${id}` }),
        );
      }
      return fileSystem.readFileString(filePath).pipe(
        catchFsErrors(StoreStorageError, `Unable to read component: ${type}/${id}`, {
          notFound: (cause) =>
            new StoreNotFoundError({
              message: `Component not found: ${type}/${id}`,
              cause,
            }),
        }),
        Effect.flatMap(decodeRecord),
      );
    };

    /**
     * Reads one record by name — the filename comes from the directory listing itself
     * (trusted, extension included), so there is no path check and no not-found fork;
     * read failures land in the list projection's skip-and-warn path.
     */
    const readRecordByName = (directory: string, entry: string) =>
      fileSystem
        .readFileString(`${directory}/${entry}`)
        .pipe(
          catchFsErrors(StoreStorageError, `Unable to decode component: ${directory}/${entry}`),
          Effect.flatMap(decodeRecord),
        );

    return {
      list: (type) => {
        const directory = path.join(configDir, type);
        return fileSystem.readDirectory(directory).pipe(
          catchFsErrors(StoreStorageError, `Unable to list components: ${type}`, {
            notFound: (cause) =>
              new StoreNotFoundError({
                message: `No components directory: ${type}`,
                cause,
              }),
          }),
          Effect.catchTag('StoreNotFoundError', () => Effect.succeed([] as Array<string>)),
          Effect.map((entries) => entries.filter((entry) => entry.endsWith('.json'))),
          Effect.flatMap((entries) =>
            Effect.forEach(entries, (entry) =>
              readRecordByName(directory, entry).pipe(
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

      get: (type, id) => readRecordById(type, id),

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
          Effect.flatMap(readRecordById(type, id), (existing) =>
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
        const filePath = readRecordPath(type, id);
        if (filePath === undefined) {
          return Effect.fail(
            new StoreStorageError({ message: `Unsafe component storage path: ${type}/${id}` }),
          );
        }
        return readRecordById(type, id).pipe(
          Effect.flatMap(() =>
            fileSystem
              .remove(filePath)
              .pipe(catchFsErrors(StoreStorageError, `Unable to delete component: ${type}/${id}`)),
          ),
          Effect.flatMap(() =>
            fileSync.fsync(path.join(configDir, type)).pipe(
              Effect.catchTag('FileSyncError', (cause) =>
                Effect.fail(
                  new StoreStorageError({
                    message: 'Unable to synchronize component directory',
                    cause,
                  }),
                ),
              ),
            ),
          ),
          Effect.asVoid,
        );
      },
    };
  }),
);
