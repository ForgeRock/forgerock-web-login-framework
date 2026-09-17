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

const errorResponse = (message: string, status: number): Response =>
  Response.json({ error: message }, { status });

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
