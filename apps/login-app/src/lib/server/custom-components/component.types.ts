/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Context, Data } from 'effect';

import type { CustomLogger } from '@forgerock/sdk-logger';
import type { Effect } from 'effect';

import type {
  ComponentRecord,
  ComponentType,
  CreateComponentRequest,
  UpdateComponentRequest,
} from './api.schemas';
import type { TokenId } from '$server/schemas';

export type ComponentLogger = Pick<CustomLogger, 'error' | 'warn' | 'info'>;

/** Synchronizes filesystem entries after writes and renames so acknowledged saves are durable. */
export interface FileSyncService {
  readonly fsync: (path: string) => Effect.Effect<void, unknown>;
}

/** Absolute path of the tracked config directory the Component API reads and writes. */
export interface ComponentStoreConfig {
  readonly trackedRoot: string;
}

/** A component file expressed relative to the configured tracked subtree. */
export interface ComponentArtifact {
  readonly relPath: string;
  readonly content: string;
}

/** Validates and atomically persists component artifacts; fails with a tagged error. */
export type ArtifactWriterFn = (
  artifacts: ReadonlyArray<ComponentArtifact>,
) => Effect.Effect<void, ArtifactWriterError>;

/** A failure raised when a repository write cannot safely complete. */
export class ArtifactWriterError extends Data.TaggedError('ArtifactWriterError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/** Why a component storage operation failed. */
export type ComponentStoreFailureReason = 'NotFound' | 'Storage';

/** A component storage failure carried on the Effect error channel. */
export class ComponentStoreError extends Data.TaggedError('ComponentStoreError')<{
  readonly reason: ComponentStoreFailureReason;
  readonly message: string;
  readonly cause?: unknown;
}> {}

/** The component record storage API. */
export interface ComponentStoreApi {
  readonly list: (
    type: ComponentType,
  ) => Effect.Effect<ReadonlyArray<ComponentRecord>, ComponentStoreError>;
  readonly get: (
    type: ComponentType,
    id: string,
  ) => Effect.Effect<ComponentRecord, ComponentStoreError>;
  readonly create: (
    type: ComponentType,
    request: CreateComponentRequest,
  ) => Effect.Effect<ComponentRecord, ComponentStoreError>;
  readonly update: (
    type: ComponentType,
    id: string,
    request: UpdateComponentRequest,
  ) => Effect.Effect<ComponentRecord, ComponentStoreError>;
  readonly remove: (type: ComponentType, id: string) => Effect.Effect<void, ComponentStoreError>;
}

/** Why a component publication failed. */
export type ComponentPublishFailureReason = 'Invalid' | 'Storage';

/** A component publication failure carried on the Effect error channel. */
export class ComponentPublishError extends Data.TaggedError('ComponentPublishError')<{
  readonly reason: ComponentPublishFailureReason;
  readonly message: string;
  readonly cause?: unknown;
}> {}

/** Validates and persists a serialized component bundle, failing with a tagged error. */
export type ComponentPublishFn = (bundle: string) => Effect.Effect<void, ComponentPublishError>;

/** An authenticated Component API caller, identified by their AM session uid. */
export interface AuthUser {
  readonly uid: string;
}

/** Why a Component API authentication attempt failed. */
export type ComponentAuthFailureReason = 'Unauthenticated' | 'Forbidden' | 'Unavailable';

/** An authentication failure carried on the Effect error channel. */
export class ComponentAuthError extends Data.TaggedError('ComponentAuthError')<{
  readonly reason: ComponentAuthFailureReason;
  readonly message: string;
  readonly cause?: unknown;
  /** Set when the AM session resolved to a user before the request was refused. */
  readonly uid?: string;
}> {}

/** AM session readers used by the authenticator; replaceable for tests. */
export interface AmSessionDependencies {
  getUserId: (tokenId: TokenId, realm?: string) => Promise<string | null>;
  getRoles: (tokenId: TokenId, uid: string) => Promise<string[]>;
}

/** HTTP statuses representable in Component API error responses. */
export type ApiErrorStatus = 400 | 401 | 403 | 404 | 413 | 415 | 500;

/** A client-facing HTTP failure encoded as the response's status and JSON error body. */
export class HttpError extends Data.TaggedError('HttpError')<{
  readonly status: ApiErrorStatus;
  readonly message: string;
}> {}

/** Service tags for the Component API dependency graph; layers provide implementations. */
export class FileSync extends Context.Tag('FileSync')<FileSync, FileSyncService>() {}

export class Writer extends Context.Tag('Writer')<Writer, ArtifactWriterFn>() {}

export class Store extends Context.Tag('Store')<Store, ComponentStoreApi>() {}

export class Publish extends Context.Tag('Publish')<Publish, ComponentPublishFn>() {}

export class Log extends Context.Tag('Log')<Log, ComponentLogger>() {}

/** Authenticates a request as an AM admin session. */
export class Auth extends Context.Tag('Auth')<
  Auth,
  (request: Request) => Effect.Effect<AuthUser, ComponentAuthError>
>() {}
