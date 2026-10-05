/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Data, Effect } from 'effect';

import type { ComponentPublisherError } from '$lib/server/component-publisher';
import type { ComponentRepoError } from '$lib/server/component-repo';

/**
 * A client-facing HTTP failure raised while validating a component API request.
 *
 * @category internal
 */
export class HttpError extends Data.TaggedError('HttpError')<{
  status: 400 | 401 | 404 | 409 | 413 | 415 | 500;
  message: string;
}> {}

/**
 * Converts a publisher validation failure into a client-facing response failure.
 *
 * @category internal
 */
export const publisherHttpError = (error: ComponentPublisherError) =>
  Effect.fail(new HttpError({ status: 400, message: error.message }));

/**
 * Converts a repository persistence failure into a server response failure.
 *
 * @category internal
 */
export const repoHttpError = (error: ComponentRepoError) =>
  Effect.fail(new HttpError({ status: 500, message: error.message }));
