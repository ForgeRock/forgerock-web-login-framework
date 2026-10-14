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

/** The component API logger surface; the full logger effects module supplies it. */
export type ComponentLogger = Pick<CustomLogger, 'error' | 'warn' | 'info'>;

/** Service tag for the component API logger; layers provide implementations. */
export const Log = Context.GenericTag<ComponentLogger>('Log');

/** Absolute path of the tracked config directory the Component API reads and writes. */
export interface ComponentStoreConfig {
  readonly trackedRoot: string;
}

/** A component file expressed relative to the configured tracked subtree. */
export interface ComponentArtifact {
  readonly relPath: string;
  readonly content: string;
}

/** An authenticated Component API caller, identified by their AM session uid. */
export interface AuthUser {
  readonly uid: string;
}

/** HTTP statuses representable in Component API error responses. */
export type ApiErrorStatus = 400 | 401 | 403 | 404 | 413 | 415 | 500 | 503;

/** A client-facing HTTP failure encoded as the response's status and JSON error body. */
export class HttpError extends Data.TaggedError('HttpError')<{
  readonly status: ApiErrorStatus;
  readonly message: string;
}> {}
