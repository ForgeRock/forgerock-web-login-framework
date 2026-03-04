import { Effect } from 'effect';
import { it, describe, expect } from '@effect/vitest';

import { readRequestBody, requireAuthorization } from './request';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Build a Request with the given body and optional Content-Length */
const makeRequest = (body: string, contentLength?: string): Request => {
  const headers = new Headers();
  if (contentLength !== undefined) {
    headers.set('content-length', contentLength);
  }
  return new Request('http://localhost/api/test', {
    method: 'POST',
    body,
    headers,
  });
};

/** Build a Request with a body of exactly `size` bytes */
const makeOversizedRequest = (size: number): Request => {
  const body = 'x'.repeat(size);
  return makeRequest(body, String(size));
};

// ─── readRequestBody ────────────────────────────────────────────────────────

describe('readRequestBody', () => {
  it.effect('readRequestBody_ValidBody_ReturnsBodyText', () =>
    readRequestBody(makeRequest('{"username":"test"}')).pipe(
      Effect.tap((result) => expect(result).toBe('{"username":"test"}')),
    ),
  );

  it.effect('readRequestBody_EmptyBody_ReturnsEmptyString', () =>
    readRequestBody(new Request('http://localhost/api/test', { method: 'POST' })).pipe(
      Effect.tap((result) => expect(result).toBe('')),
    ),
  );

  it.effect('readRequestBody_OversizedContentLength_FailsWithRequestBodyError', () =>
    readRequestBody(makeOversizedRequest(1_048_577)).pipe(
      Effect.flip,
      Effect.tap((e) => expect(e._tag).toBe('RequestBodyError')),
    ),
  );

  it.effect('readRequestBody_ExactlyAtLimit_Succeeds', () => {
    const body = 'x'.repeat(1_048_576);
    return readRequestBody(makeRequest(body, String(1_048_576))).pipe(
      Effect.tap((result) => expect(result).toBe(body)),
    );
  });

  it.effect('readRequestBody_MultiByte_DecodesCorrectly', () => {
    const body = '{"name":"日本語テスト"}';
    return readRequestBody(makeRequest(body)).pipe(
      Effect.tap((result) => expect(result).toBe(body)),
    );
  });

  it.effect(
    'readRequestBody_StreamExceedsLimitWithoutContentLength_FailsWithRequestBodyError',
    () => {
      // Build a ReadableStream that emits more bytes than the 1MB limit.
      // No Content-Length header, so the early reject path is skipped —
      // this exercises the streaming byte counter in consumeBody.
      const chunk = new TextEncoder().encode('x'.repeat(1024));
      let bytesEmitted = 0;
      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          if (bytesEmitted > 1_048_576) {
            controller.close();
            return;
          }
          controller.enqueue(chunk);
          bytesEmitted += chunk.byteLength;
        },
      });

      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        body: stream,
        // @ts-expect-error -- Node.js requires 'duplex' for streaming bodies but TS lib doesn't define it
        duplex: 'half',
      });
      request.headers.delete('content-length');

      return readRequestBody(request).pipe(
        Effect.flip,
        Effect.tap((e) => expect(e._tag).toBe('RequestBodyError')),
      );
    },
  );
});

// ─── requireAuthorization ───────────────────────────────────────────────────

describe('requireAuthorization', () => {
  it.effect('requireAuthorization_HeaderPresent_ReturnsHeaderValue', () =>
    requireAuthorization(
      new Request('http://localhost/api/test', {
        headers: { authorization: 'Bearer abc123' },
      }),
    ).pipe(Effect.tap((result) => expect(result).toBe('Bearer abc123'))),
  );

  it.effect('requireAuthorization_HeaderMissing_FailsWithBffClientError', () =>
    requireAuthorization(new Request('http://localhost/api/test')).pipe(
      Effect.flip,
      Effect.tap((e) => {
        expect(e._tag).toBe('BffClientError');
        expect(e.status).toBe(401);
      }),
    ),
  );
});
