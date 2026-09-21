/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect } from 'effect';

import { type ComponentPublisherService, publishComponent } from './component-publisher';
import { ComponentPublisherRuntime } from './runtime';

import type { Layer } from 'effect';

import type { ComponentPublisherError } from './component-publisher';
import type { ComponentRepoError } from './component-repo';

/** Maximum accepted serialized bundle size, in characters. */
export const MAX_COMPONENT_BUNDLE_SIZE = 1024 * 1024;

/** Returns true only for JSON media types, including optional charset parameters. */
export const isJsonContentType = (contentType: string | null): boolean =>
  contentType?.split(';', 1)[0]?.trim().toLowerCase() === 'application/json';

export interface SaveEndpointDependencies {
  readonly runtime?: Layer.Layer<ComponentPublisherService, never, never>;
  /** Production deployments must set this token before exposing this route to untrusted networks. */
  readonly token?: string;
}

const errorResponse = (message: string, status: number): Response =>
  Response.json({ error: message }, { status });

const isAuthorized = (authorization: string | null, token: string | undefined): boolean =>
  token === undefined || authorization === `Bearer ${token}`;

/**
 * Validates an incoming component-bundle request and publishes it with the supplied dependencies.
 * The route invokes `Effect.runPromise` at the system edge.
 */
export const publishComponentBundle = (
  request: Request,
  dependencies: SaveEndpointDependencies = {},
): Effect.Effect<Response> => {
  const runtime = dependencies.runtime ?? ComponentPublisherRuntime;
  const contentLength = request.headers.get('content-length');
  const declaredLength = contentLength === null ? undefined : Number(contentLength);

  if (!isAuthorized(request.headers.get('authorization'), dependencies.token)) {
    return Effect.succeed(errorResponse('Unauthorized', 401));
  }
  if (!isJsonContentType(request.headers.get('content-type'))) {
    return Effect.succeed(errorResponse('Content-Type must be application/json', 415));
  }
  if (
    declaredLength !== undefined &&
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_COMPONENT_BUNDLE_SIZE
  ) {
    return Effect.succeed(errorResponse('Component bundle exceeds the 1 MiB limit', 413));
  }

  return Effect.tryPromise({
    try: () => request.text(),
    catch: () => new Error('Unable to read component bundle'),
  }).pipe(
    Effect.matchEffect({
      onFailure: () => Effect.succeed(errorResponse('Unable to read component bundle', 400)),
      onSuccess: (bundle) =>
        bundle.length > MAX_COMPONENT_BUNDLE_SIZE
          ? Effect.succeed(errorResponse('Component bundle exceeds the 1 MiB limit', 413))
          : publishComponent(bundle).pipe(
              Effect.as(new Response(null, { status: 204 })),
              Effect.catchTag('ComponentPublisherError', (error: ComponentPublisherError) =>
                Effect.succeed(errorResponse(error.message, 400)),
              ),
              Effect.catchTag('ComponentRepoError', (error: ComponentRepoError) =>
                Effect.succeed(errorResponse(error.message, 500)),
              ),
            ),
    }),
    Effect.provide(runtime),
  );
};
