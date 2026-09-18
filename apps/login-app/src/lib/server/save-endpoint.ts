/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect } from 'effect';

import {
  type ComponentPublisherService,
  publishComponent,
} from './component-publisher';
import { ComponentPublisherRuntime } from './runtime';

import type { Layer } from 'effect';

import type {
  ComponentPublisherError} from './component-publisher';
import type { ComponentRepoError } from './component-repo';

/**
 * Creates the JSON error response returned when bundle validation or persistence fails.
 *
 * @param message - Safe error message to expose to the caller.
 * @param status - HTTP status representing the failure category.
 * @returns A JSON response containing the error message.
 */
const errorResponse = (message: string, status: number): Response =>
  Response.json({ error: message }, { status });

/**
 * Publishes a component bundle and maps service failures to HTTP responses.
 * Invalid JSON, schema violations, and unsafe paths return 400; repository failures return 500.
 *
 * @param bundle - Serialized component bundle received by the endpoint.
 * @param runtime - Publisher layer used to execute the service; defaults to the production runtime.
 * @returns An effect that resolves to 204 on success or an error response after providing the runtime.
 */
export const publishComponentBundle = (
  bundle: string,
  runtime: Layer.Layer<ComponentPublisherService, never, never> = ComponentPublisherRuntime,
): Effect.Effect<Response> =>
  publishComponent(bundle).pipe(
    Effect.as(new Response(null, { status: 204 })),
    Effect.catchTag('ComponentPublisherError', (error: ComponentPublisherError) =>
      Effect.succeed(errorResponse(error.message, 400)),
    ),
    Effect.catchTag('ComponentRepoError', (error: ComponentRepoError) =>
      Effect.succeed(errorResponse(error.message, 500)),
    ),
    Effect.provide(runtime),
  );
