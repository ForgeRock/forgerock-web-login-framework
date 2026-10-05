/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import type {
  ComponentRecord,
  ComponentType,
  CreateComponentRequest,
  UpdateComponentRequest,
} from './api.schemas';
import type { TokenId } from '$server/schemas';

/** A failure raised while persisting or synchronizing component files. */
export interface FileSyncError {
  readonly message: string;
  readonly cause?: unknown;
}

/** Synchronizes filesystem entries after writes and renames so acknowledged saves are durable. */
export interface FileSyncService {
  readonly syncFile: (path: string) => Promise<void>;
  readonly syncDirectory: (path: string) => Promise<void>;
}

/** Location of the repository root and its tracked component subtree. */
export interface ComponentRepoConfig {
  readonly repoDir: string;
  readonly trackedSubpath: string;
}

/** A component file expressed relative to the configured tracked subtree. */
export interface ComponentArtifact {
  readonly relPath: string;
  readonly content: string;
}

/** Validates and atomically persists component artifacts; throws plain errors on failure. */
export type ComponentRepoFn = (artifacts: ReadonlyArray<ComponentArtifact>) => Promise<void>;

/** A failure raised when a repository write cannot safely complete. */
export interface ComponentRepoError {
  readonly message: string;
  readonly cause?: unknown;
}

/** A component storage failure returned as a value, never thrown. */
export interface ComponentStoreError {
  readonly reason: ComponentStoreFailureReason;
  readonly message: string;
  readonly cause?: unknown;
}

/** Why a component storage operation failed. */
export type ComponentStoreFailureReason = 'NotFound' | 'Storage';

/** The result of a component storage operation. */
export type ComponentStoreResult<Value> =
  | { readonly success: true; readonly value: Value }
  | { readonly success: false; readonly error: ComponentStoreError };

/** The component record storage API returned by {@link createComponentStore}. */
export interface ComponentStoreApi {
  readonly list: (
    type: ComponentType,
  ) => Promise<ComponentStoreResult<ReadonlyArray<ComponentRecord>>>;
  readonly get: (type: ComponentType, id: string) => Promise<ComponentStoreResult<ComponentRecord>>;
  readonly create: (
    type: ComponentType,
    request: CreateComponentRequest,
  ) => Promise<ComponentStoreResult<ComponentRecord>>;
  readonly update: (
    type: ComponentType,
    id: string,
    request: UpdateComponentRequest,
  ) => Promise<ComponentStoreResult<ComponentRecord>>;
  readonly remove: (type: ComponentType, id: string) => Promise<ComponentStoreResult<void>>;
}

/** A component publication failure returned as a value, never thrown. */
export interface ComponentPublishError {
  readonly reason: ComponentPublishFailureReason;
  readonly message: string;
  readonly cause?: unknown;
}

/** Why a component publication failed. */
export type ComponentPublishFailureReason = 'Invalid' | 'Storage';

/** The result of a component publication operation. */
export type ComponentPublishResult =
  | { readonly success: true; readonly value: void }
  | { readonly success: false; readonly error: ComponentPublishError };

/** Validates and persists a serialized component bundle, returning failures as values. */
export type ComponentPublishFn = (bundle: string) => Promise<ComponentPublishResult>;

/** An authenticated Component API caller, identified by their AM session uid. */
export interface AuthUser {
  readonly uid: string;
}

/** Why a Component API authentication attempt failed. */
export type ComponentAuthFailureReason = 'Unauthenticated' | 'Forbidden' | 'Unavailable';

/** An authentication failure returned as a value, never thrown. */
export interface ComponentAuthError {
  readonly reason: ComponentAuthFailureReason;
  readonly message: string;
  readonly cause?: unknown;
}

/** The result of a Component API authentication attempt. */
export type ComponentAuthResult =
  | { readonly success: true; readonly value: AuthUser }
  | { readonly success: false; readonly error: ComponentAuthError };

/** AM session readers used by the authenticator; replaceable for tests. */
export interface AmSessionDependencies {
  getUserId: (tokenId: TokenId, realm?: string) => Promise<string | null>;
  getRoles: (tokenId: TokenId, uid: string) => Promise<string[]>;
}

/** HTTP statuses representable in Component API error responses. */
export type ApiErrorStatus = 400 | 401 | 403 | 404 | 413 | 415 | 500;

/** A client-facing HTTP failure encoded as the response's status and JSON error body. */
export interface HttpError {
  readonly status: ApiErrorStatus;
  readonly message: string;
}

/** Handler dependencies; runtime wires the real functions, tests substitute their own. */
export interface ComponentApiDependencies {
  readonly authenticate: (request: Request) => Promise<ComponentAuthResult>;
  readonly store: ComponentStoreApi;
  readonly publish: ComponentPublishFn;
}
