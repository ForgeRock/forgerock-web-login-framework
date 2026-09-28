/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Data, Effect } from 'effect';

/** A client-facing HTTP failure raised while validating a component API request. */
export class HttpError extends Data.TaggedError('HttpError')<{
  status: 400 | 401 | 404 | 409 | 413 | 415 | 500;
  message: string;
}> {}

/** Converts an invalid list fields projection into its HTTP response failure. */
export const invalidFieldsHttpError = (error: { message: string }) =>
  Effect.fail(new HttpError({ status: 400, message: error.message }));
