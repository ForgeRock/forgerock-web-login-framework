/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { randomUUID } from 'node:crypto';
import { readdir, readFile, rm } from 'node:fs/promises';

import { type ComponentRecord, ComponentRecordSchema, type ComponentType } from './fields.utils';
import { isSafeRelativePath, joinPath } from './repo';

import type {
  ComponentRepoConfig,
  ComponentRepoFn,
  ComponentStoreApi,
  ComponentStoreError,
  ComponentStoreFailureReason,
  ComponentStoreResult,
  FileSyncService,
} from './component.types';

/** Builds a failure result for a component storage operation. */
export const storeError = (
  reason: ComponentStoreFailureReason,
  message: string,
  cause?: unknown,
): ComponentStoreResult<never> => ({ success: false, error: { reason, message, cause } });

/** Wraps a storage operation so thrown infrastructure errors become Storage failures. */
const asStorageResult = async <Value>(
  message: string,
  operation: () => Promise<Value>,
): Promise<ComponentStoreResult<Value>> => {
  try {
    return { success: true, value: await operation() };
  } catch (cause) {
    return storeError('Storage', message, cause);
  }
};

/** Identifies filesystem failures that represent missing records. */
const isNotFound = (cause: unknown): boolean =>
  typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === 'ENOENT';

/** Parses and validates serialized component-record JSON as a result. */
const decodeRecord = (content: string, message: string): ComponentStoreResult<ComponentRecord> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (cause) {
    return storeError('Storage', message, cause);
  }
  const result = ComponentRecordSchema.safeParse(parsed);
  if (!result.success) {
    return storeError('Storage', message, result.error);
  }
  return { success: true, value: result.data };
};

/** Builds a safe repository path for a component record, or a Storage failure. */
const recordPath = (
  trackedRoot: string,
  type: ComponentType,
  id: string,
): { directory: string; finalPath: string; relPath: string } | ComponentStoreError => {
  const relPath = `${type}/${id}.json`;
  if (!isSafeRelativePath(relPath)) {
    return { reason: 'Storage', message: `Unsafe component storage path: ${relPath}` };
  }
  return {
    directory: joinPath(trackedRoot, type),
    finalPath: joinPath(trackedRoot, relPath),
    relPath,
  };
};

/** Reads and decodes one record file, mapping missing files to NotFound. */
const readRecord = async (
  finalPath: string,
  notFoundMessage: string,
  storageMessage: string,
): Promise<ComponentStoreResult<ComponentRecord>> => {
  let content: string;
  try {
    content = await readFile(finalPath, 'utf8');
  } catch (cause) {
    return isNotFound(cause)
      ? storeError('NotFound', notFoundMessage, cause)
      : storeError('Storage', storageMessage, cause);
  }
  return decodeRecord(content, storageMessage);
};

/**
 * Component storage operations backed by the configured component repository. List
 * deliberately skips malformed JSON artifacts without logging.
 *
 * @param config - Repository root and tracked subtree configuration.
 * @param repo - The `saveArtifacts` function from {@link createComponentRepo}.
 * @param fileSync - Durability synchronization service.
 * @returns A {@link ComponentStoreApi} whose operations return failures as values.
 */
export const createComponentStore = (
  config: ComponentRepoConfig,
  repo: ComponentRepoFn,
  fileSync: FileSyncService,
): ComponentStoreApi => {
  const trackedRoot = joinPath(config.repoDir, config.trackedSubpath);

  const writeRecord = async (
    type: ComponentType,
    id: string,
    record: ComponentRecord,
  ): Promise<ComponentStoreResult<ComponentRecord>> => {
    const path = recordPath(trackedRoot, type, id);
    if ('reason' in path) {
      return { success: false, error: path };
    }
    const saved = await asStorageResult('Unable to save component record', () =>
      repo([{ relPath: path.relPath, content: JSON.stringify(record) }]),
    );
    return saved.success ? { success: true, value: record } : saved;
  };

  return {
    list: async (type) => {
      const directory = joinPath(trackedRoot, type);
      let entries: string[];
      try {
        entries = await readdir(directory);
      } catch (cause) {
        return isNotFound(cause)
          ? { success: true, value: [] }
          : storeError('Storage', `Unable to list components: ${type}`, cause);
      }
      const decoded = await Promise.all(
        entries
          .filter((entry) => entry.endsWith('.json'))
          .map((entry) =>
            readFile(`${directory}/${entry}`, 'utf8').then(
              (content) => decodeRecord(content, `Unable to decode component: ${type}/${entry}`),
              () => storeError('Storage', `Unable to decode component: ${type}/${entry}`),
            ),
          ),
      );
      return {
        success: true,
        value: decoded.flatMap((result) => (result.success ? [result.value] : [])),
      };
    },

    get: async (type, id) => {
      const path = recordPath(trackedRoot, type, id);
      if ('reason' in path) {
        return { success: false, error: path };
      }
      return readRecord(
        path.finalPath,
        `Component not found: ${type}/${id}`,
        `Unable to decode component: ${type}/${id}`,
      );
    },

    create: async (type, request) => {
      const id = randomUUID();
      const now = new Date().toISOString();
      return writeRecord(type, id, {
        id,
        src: request.src,
        ...(request.json === undefined ? {} : { json: request.json }),
        meta: { ...request.meta, createdDate: now, modifiedDate: now },
      });
    },

    update: async (type, id, request) => {
      const path = recordPath(trackedRoot, type, id);
      if ('reason' in path) {
        return { success: false, error: path };
      }
      const existing = await readRecord(
        path.finalPath,
        `Component not found: ${type}/${id}`,
        `Unable to decode component: ${type}/${id}`,
      );
      if (!existing.success) {
        return existing;
      }
      return writeRecord(type, id, {
        id,
        src: request.src,
        ...(request.json === undefined ? {} : { json: request.json }),
        meta: {
          ...request.meta,
          createdDate: existing.value.meta.createdDate,
          modifiedDate: new Date().toISOString(),
        },
      });
    },

    remove: async (type, id) => {
      const path = recordPath(trackedRoot, type, id);
      if ('reason' in path) {
        return { success: false, error: path };
      }
      const existing = await readRecord(
        path.finalPath,
        `Component not found: ${type}/${id}`,
        `Unable to decode component: ${type}/${id}`,
      );
      if (!existing.success) {
        return existing;
      }
      const removed = await asStorageResult(`Unable to delete component: ${type}/${id}`, () =>
        rm(path.finalPath),
      );
      if (!removed.success) {
        return removed;
      }
      return asStorageResult('Unable to synchronize component directory', () =>
        fileSync.syncDirectory(path.directory),
      );
    },
  };
};
