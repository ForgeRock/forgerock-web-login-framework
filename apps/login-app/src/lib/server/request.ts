import { Chunk, Effect, pipe, Ref, Stream } from 'effect';

import { BffClientError, RequestBodyError } from '$server/errors';
import { RateLimiterService } from '$server/services/rate-limiter';

/** Maximum request body size in bytes (1MB) */
const MAX_BODY_SIZE = 1_048_576;

/** Fail fast if Content-Length exceeds the limit */
const checkContentLength = (request: Request): Effect.Effect<void, RequestBodyError> => {
  const raw = request.headers.get('content-length');
  if (!raw) return Effect.void;
  const contentLength = parseInt(raw, 10);
  // Invalid or negative Content-Length — skip early check, let streaming check handle it
  if (Number.isNaN(contentLength) || contentLength < 0) return Effect.void;
  return contentLength > MAX_BODY_SIZE
    ? Effect.fail(
        new RequestBodyError({
          cause: new Error(`Request body too large: ${contentLength} bytes (max ${MAX_BODY_SIZE})`),
        }),
      )
    : Effect.void;
};

/** Decode accumulated Uint8Array chunks to a UTF-8 string */
const decodeChunks = (chunks: ReadonlyArray<Uint8Array>): string => {
  const decoder = new TextDecoder();
  return chunks.map((chunk) => decoder.decode(chunk, { stream: true })).join('') + decoder.decode();
};

/** Read the request body stream with a byte counter to prevent OOM */
const consumeBody = (request: Request): Effect.Effect<string, RequestBodyError> => {
  const body = request.body;
  if (!body) return Effect.succeed('');

  return Ref.make(0).pipe(
    Effect.flatMap((bytesRead) =>
      pipe(
        Stream.fromReadableStream(
          () => body,
          (cause) => new RequestBodyError({ cause }),
        ),
        Stream.tap((chunk: Uint8Array) =>
          Ref.updateAndGet(bytesRead, (n) => n + chunk.byteLength).pipe(
            Effect.filterOrFail(
              (total) => total <= MAX_BODY_SIZE,
              () =>
                new RequestBodyError({
                  cause: new Error(`Request body too large: exceeded ${MAX_BODY_SIZE} bytes`),
                }),
            ),
            Effect.asVoid,
          ),
        ),
        Stream.runCollect,
      ),
    ),
    Effect.map((chunks) => decodeChunks(Chunk.toReadonlyArray(chunks))),
  );
};

/**
 * Safely read the request body as text with a size limit.
 *
 * Checks Content-Length first for an early reject, then stream-reads with
 * a byte counter for chunked transfers. Fails with `RequestBodyError` if
 * the body exceeds MAX_BODY_SIZE (1MB) or if reading fails.
 */
export const readRequestBody = Effect.fn('readRequestBody')((request: Request) =>
  checkContentLength(request).pipe(Effect.andThen(consumeBody(request))),
);

/**
 * Check rate limit for the given IP and endpoint.
 * Uses the RateLimiterService from the Effect context.
 */
export const checkRateLimit = (ip: string, endpoint: string) =>
  RateLimiterService.pipe(Effect.flatMap((limiter) => limiter.checkRate(ip, endpoint)));

/** Extract the Authorization header, failing if absent or empty */
export const requireAuthorization = Effect.fn('requireAuthorization')((request: Request) => {
  const header = request.headers.get('authorization');
  return header
    ? Effect.succeed(header)
    : Effect.fail(new BffClientError({ status: 401, message: 'Authorization header required' }));
});
