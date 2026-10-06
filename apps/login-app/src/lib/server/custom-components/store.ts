/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect, Layer, Schema } from 'effect';
import { randomUUID } from 'node:crypto';
import { readdir, readFile, rm } from 'node:fs/promises';

import { isSafeRelativePath, joinPath } from './artifact-writer';
import { ComponentStoreError, FileSync, Log, Store, Writer } from './component.types';
import { ComponentRecordSchema, type ComponentType } from './fields.utils';

import type { ComponentStoreApi, ComponentStoreConfig } from './component.types';

/** Identifies filesystem failures that represent missing records. */
const isNotFound = (cause: unknown): boolean =>
  typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === 'ENOENT';

/** Builds a safe repository path for a component record. */
const recordPath = (trackedRoot: string, type: ComponentType, id: string): string => {
  const relPath = `${type}/${id}.json`;
  if (!isSafeRelativePath(relPath)) {
    throw new ComponentStoreError({
      reason: 'Storage',
      message: `Unsafe component storage path: ${relPath}`,
    });
  }
  return joinPath(trackedRoot, relPath);
};

/** Parses and validates serialized component-record JSON. */
const decodeRecord =
  (message: string) =>
  (content: string): Effect.Effect<typeof ComponentRecordSchema.Type, ComponentStoreError> =>
    Effect.mapError(
      Effect.try(() => Schema.decodeUnknownSync(ComponentRecordSchema)(JSON.parse(content))),
      (cause) => new ComponentStoreError({ reason: 'Storage', message, cause }),
    );

/**
 * Component storage operations backed by the configured component repository. List
 * skips malformed JSON artifacts and logs a warning for each one.
 *
 * @param config - Tracked config directory configuration.
 * @returns A layer providing the record store, requiring the writer, fsync, and log services.
 */
export const StoreLive = (
  config: ComponentStoreConfig,
): Layer.Layer<Store, never, Writer | FileSync | Log> =>
  Layer.effect(
    Store,
    Effect.all([Writer, FileSync, Log], { concurrency: 'unbounded' }).pipe(
      Effect.map(([writer, fileSync, log]): ComponentStoreApi => {
        const trackedRoot = config.trackedRoot;

        const writeRecord = (
          type: ComponentType,
          id: string,
          record: typeof ComponentRecordSchema.Type,
        ): Effect.Effect<typeof ComponentRecordSchema.Type, ComponentStoreError> =>
          Effect.mapError(
            writer([{ relPath: `${type}/${id}.json`, content: JSON.stringify(record) }]),
            (cause) =>
              new ComponentStoreError({
                reason: 'Storage',
                message: 'Unable to save component record',
                cause,
              }),
          ).pipe(Effect.as(record));

        const readRecord = (
          type: ComponentType,
          id: string,
        ): Effect.Effect<typeof ComponentRecordSchema.Type, ComponentStoreError> =>
          Effect.tryPromise({
            try: () => readFile(recordPath(trackedRoot, type, id), 'utf8'),
            catch: (cause) =>
              isNotFound(cause)
                ? new ComponentStoreError({
                    reason: 'NotFound',
                    message: `Component not found: ${type}/${id}`,
                    cause,
                  })
                : new ComponentStoreError({
                    reason: 'Storage',
                    message: `Unable to read component: ${type}/${id}`,
                    cause,
                  }),
          }).pipe(Effect.flatMap(decodeRecord(`Unable to decode component: ${type}/${id}`)));

        /** Reads every `.json` record file, carrying each entry with its decoded result-or-error. */
        const readDirectoryEntries =
          (directory: string, type: ComponentType) => (entries: ReadonlyArray<string>) =>
            Effect.forEach(entries, (entry) =>
              Effect.map(
                Effect.either(
                  Effect.tryPromise({
                    try: () => readFile(`${directory}/${entry}`, 'utf8'),
                    catch: (cause) =>
                      new ComponentStoreError({
                        reason: 'Storage',
                        message: `Unable to decode component: ${type}/${entry}`,
                        cause,
                      }),
                  }).pipe(
                    Effect.flatMap(decodeRecord(`Unable to decode component: ${type}/${entry}`)),
                  ),
                ),
                (either) => ({ entry, either }),
              ),
            );

        return {
          list: (type) =>
            Effect.tryPromise({
              try: () => readdir(joinPath(trackedRoot, type)),
              catch: (cause) =>
                isNotFound(cause)
                  ? new ComponentStoreError({
                      reason: 'NotFound',
                      message: `No components directory: ${type}`,
                      cause,
                    })
                  : new ComponentStoreError({
                      reason: 'Storage',
                      message: `Unable to list components: ${type}`,
                      cause,
                    }),
            }).pipe(
              Effect.catchAll((error) =>
                error.reason === 'NotFound'
                  ? Effect.succeed([] as ReadonlyArray<string>)
                  : Effect.fail(error),
              ),
              Effect.map((entries) => entries.filter((entry) => entry.endsWith('.json'))),
              Effect.flatMap(readDirectoryEntries(joinPath(trackedRoot, type), type)),
              Effect.map((decoded) => {
                const records: Array<typeof ComponentRecordSchema.Type> = [];
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
            ),

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

          remove: (type, id) =>
            readRecord(type, id).pipe(
              Effect.flatMap(() =>
                Effect.tryPromise({
                  try: () => rm(recordPath(trackedRoot, type, id)),
                  catch: (cause) =>
                    new ComponentStoreError({
                      reason: 'Storage',
                      message: `Unable to delete component: ${type}/${id}`,
                      cause,
                    }),
                }),
              ),
              Effect.flatMap(() =>
                Effect.mapError(
                  fileSync.fsync(joinPath(trackedRoot, type)),
                  (cause) =>
                    new ComponentStoreError({
                      reason: 'Storage',
                      message: 'Unable to synchronize component directory',
                      cause,
                    }),
                ),
              ),
              Effect.asVoid,
            ),
        };
      }),
    ),
  );
