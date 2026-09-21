/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Effect, Schema } from 'effect';

import { type ComponentPublisherService, publishComponent } from './component-publisher';
import { ComponentPublisherRuntime } from './runtime';

import type { Layer } from 'effect';

import type { ComponentPublisherError } from './component-publisher';
import type { ComponentRepoError } from './component-repo';

/** Maximum accepted serialized bundle size, in characters. */
export const MAX_COMPONENT_BUNDLE_SIZE = 1024 * 1024;

const errorBodySchema = Schema.Struct({ error: Schema.String });

const responseSchema = <const Status extends 400 | 401 | 413 | 415 | 500>(status: Status) =>
  Schema.Struct({ status: Schema.Literal(status), body: errorBodySchema });

/** The encoded contract for every response produced by the save endpoint. */
export const SaveEndpointResponse = Schema.Union(
  Schema.Struct({ status: Schema.Literal(204), body: Schema.Void }),
  responseSchema(400),
  responseSchema(401),
  responseSchema(413),
  responseSchema(415),
  responseSchema(500),
);

type SaveEndpointResponse = Schema.Schema.Type<typeof SaveEndpointResponse>;

export const encodeSaveEndpointResponse = (response: SaveEndpointResponse): Response => {
  const encoded = Schema.encodeSync(SaveEndpointResponse)(response);

  return encoded.status === 204
    ? new Response(null, { status: encoded.status })
    : Response.json(encoded.body, { status: encoded.status });
};

const successResponse = (): Response =>
  encodeSaveEndpointResponse({ status: 204, body: undefined });

const errorResponse = (
  status: 400 | 401 | 413 | 415 | 500,
  error: string,
): Response => encodeSaveEndpointResponse({ status, body: { error } });

const nullableString = Schema.Union(Schema.String, Schema.Null);

const contentTypeSchema = nullableString.pipe(
  Schema.filter(
    (contentType) =>
      contentType?.split(';', 1)[0]?.trim().toLowerCase() === 'application/json',
    { message: () => 'Content-Type must be application/json' },
  ),
);

const declaredLengthSchema = nullableString.pipe(
  Schema.filter(
    (contentLength) => {
      const length = contentLength === null ? undefined : Number(contentLength);
      return length === undefined || !Number.isFinite(length) || length <= MAX_COMPONENT_BUNDLE_SIZE;
    },
    { message: () => 'Component bundle exceeds the 1 MiB limit' },
  ),
);

const bundleSchema = Schema.String.pipe(
  Schema.filter((bundle) => bundle.length <= MAX_COMPONENT_BUNDLE_SIZE, {
    message: () => 'Component bundle exceeds the 1 MiB limit',
  }),
);

const authorizationSchema = (token: string | undefined) =>
  nullableString.pipe(
    Schema.filter((authorization) => token === undefined || authorization === `Bearer ${token}`, {
      message: () => 'Unauthorized',
    }),
  );

/** Relevant request headers decoded by Effect Schema before publishing. */
export const SaveRequestHeaders = Schema.Struct({
  authorization: nullableString,
  contentLength: nullableString,
  contentType: nullableString,
});

/** Returns true only for JSON media types, including optional charset parameters. */
export const isJsonContentType = (contentType: string | null): boolean =>
  Schema.is(contentTypeSchema)(contentType);

export interface SaveEndpointDependencies {
  readonly runtime?: Layer.Layer<ComponentPublisherService, never, never>;
  /** Production deployments must set this token before exposing this route to untrusted networks. */
  readonly token?: string;
}

const decodeOrResponse = <A>(
  schema: Schema.Schema<A>,
  input: unknown,
  status: 400 | 401 | 413 | 415,
  message: string,
): Effect.Effect<A | Response> =>
  Schema.decodeUnknown(schema)(input).pipe(
    Effect.match({
      onFailure: () => errorResponse(status, message),
      onSuccess: (value) => value,
    }),
  );

/**
 * Validates an incoming component-bundle request and publishes it with the supplied dependencies.
 * The route invokes `Effect.runPromise` at the system edge.
 */
export const publishComponentBundle = (
  request: Request,
  dependencies: SaveEndpointDependencies = {},
): Effect.Effect<Response> => {
  const runtime = dependencies.runtime ?? ComponentPublisherRuntime;
  const headers = {
    authorization: request.headers.get('authorization'),
    contentLength: request.headers.get('content-length'),
    contentType: request.headers.get('content-type'),
  };

  return Effect.gen(function* () {
    const authorized = yield* decodeOrResponse(
      authorizationSchema(dependencies.token),
      headers.authorization,
      401,
      'Unauthorized',
    );
    if (authorized instanceof Response) return authorized;

    const contentType = yield* decodeOrResponse(
      contentTypeSchema,
      headers.contentType,
      415,
      'Content-Type must be application/json',
    );
    if (contentType instanceof Response) return contentType;

    const declaredLength = yield* decodeOrResponse(
      declaredLengthSchema,
      headers.contentLength,
      413,
      'Component bundle exceeds the 1 MiB limit',
    );
    if (declaredLength instanceof Response) return declaredLength;

    const body = yield* Effect.tryPromise({
      try: () => request.text(),
      catch: () => new Error('Unable to read component bundle'),
    }).pipe(
      Effect.match({
        onFailure: () => errorResponse(400, 'Unable to read component bundle'),
        onSuccess: (bundle) => bundle,
      }),
    );
    if (body instanceof Response) return body;

    const bundle = yield* decodeOrResponse(
      bundleSchema,
      body,
      413,
      'Component bundle exceeds the 1 MiB limit',
    );
    if (bundle instanceof Response) return bundle;

    return yield* publishComponent(bundle).pipe(
      Effect.as(successResponse()),
      Effect.catchTag('ComponentPublisherError', (error: ComponentPublisherError) =>
        Effect.succeed(errorResponse(400, error.message)),
      ),
      Effect.catchTag('ComponentRepoError', (error: ComponentRepoError) =>
        Effect.succeed(errorResponse(500, error.message)),
      ),
      Effect.provide(runtime),
    );
  });
};
