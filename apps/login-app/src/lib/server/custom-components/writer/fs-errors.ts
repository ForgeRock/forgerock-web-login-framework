/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect } from 'effect';

import type { BadArgument, SystemError } from '@effect/platform/Error';

/**
 * Translates the platform's uniform file errors into one component error class. A
 * `SystemError` with reason `NotFound` may map to a distinct not-found error instead:
 *
 *   class = StoreStorageError, message = 'Unable to read component'
 *     → returns SystemError | BadArgument failures mapped to new StoreStorageError({ message, cause })
 */
export const catchFsErrors =
  <ErrorInstance, NotFoundInstance = never>(
    errorClass: new (args: { readonly message: string; readonly cause?: unknown }) => ErrorInstance,
    message: string,
    options?: { readonly notFound?: (cause: SystemError) => NotFoundInstance },
  ) =>
  <A, R>(
    effect: Effect.Effect<A, SystemError | BadArgument, R>,
  ): Effect.Effect<A, ErrorInstance | NotFoundInstance, R> =>
    Effect.catchTags(effect, {
      SystemError: (cause: SystemError) =>
        cause.reason === 'NotFound' && options?.notFound !== undefined
          ? Effect.fail(options.notFound(cause))
          : Effect.fail(new errorClass({ message, cause })),
      BadArgument: (cause: BadArgument) => Effect.fail(new errorClass({ message, cause })),
    });
