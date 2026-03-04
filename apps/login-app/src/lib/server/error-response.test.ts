import { Headers, HttpServerResponse } from '@effect/platform';
import { Effect } from 'effect';
import { it, describe, expect } from '@effect/vitest';

import {
  AmError,
  AmUnreachable,
  BffClientError,
  CookieDecryptionFailed,
  CookieMissing,
  RequestBodyError,
  ServiceUnavailable,
  StepMappingError,
} from '$server/errors';

import {
  amResponseToHttp,
  catchDefect,
  errorToMessage,
  errorToResponse,
  parseAmErrorMessage,
} from './error-response';

/** Run the effectful errorToResponse and convert to a web Response for assertions */
const toWebResponse = (error: Parameters<typeof errorToResponse>[0]): Effect.Effect<Response> =>
  errorToResponse(error).pipe(Effect.map(HttpServerResponse.toWeb));

// ─── errorToResponse ────────────────────────────────────────────────────────

describe('errorToResponse', () => {
  it.effect('errorToResponse_AmUnreachable_Returns502', () =>
    toWebResponse(new AmUnreachable({ kind: 'connection', cause: new Error('timeout') })).pipe(
      Effect.tap((response) => expect(response.status).toBe(502)),
    ),
  );

  it.effect('errorToResponse_AmError_SanitizesBodyAndPassesThroughStatus', () => {
    const body = JSON.stringify({ message: 'Invalid credentials' });
    return toWebResponse(new AmError({ status: 401, body })).pipe(
      Effect.tap(async (response) => {
        expect(response.status).toBe(401);
        const parsed = JSON.parse(await response.text());
        expect(parsed.error).toBe('Invalid credentials');
      }),
    );
  });

  it.effect('errorToResponse_BffClientError_ReturnsConfiguredStatus', () =>
    toWebResponse(new BffClientError({ status: 400, message: 'Missing PKCE verifier' })).pipe(
      Effect.tap(async (response) => {
        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toBe('Missing PKCE verifier');
      }),
    ),
  );

  it.effect('errorToResponse_RequestBodyError_Returns400', () =>
    toWebResponse(new RequestBodyError({ cause: new Error('body too large') })).pipe(
      Effect.tap((response) => expect(response.status).toBe(400)),
    ),
  );

  it.effect('errorToResponse_CookieDecryptionFailed_Returns401', () =>
    toWebResponse(
      new CookieDecryptionFailed({ cookie: '__session', cause: new Error('bad key') }),
    ).pipe(Effect.tap((response) => expect(response.status).toBe(401))),
  );

  it.effect('errorToResponse_CookieMissing_Returns401', () =>
    toWebResponse(new CookieMissing({ cookie: '__aid' })).pipe(
      Effect.tap((response) => expect(response.status).toBe(401)),
    ),
  );

  it.effect('errorToResponse_StepMappingError_Returns400', () =>
    toWebResponse(new StepMappingError({ message: 'Mismatched IDToken' })).pipe(
      Effect.tap((response) => expect(response.status).toBe(400)),
    ),
  );

  it.effect('errorToResponse_ServiceUnavailable_Returns503', () =>
    toWebResponse(new ServiceUnavailable({ message: 'OIDC discovery pending' })).pipe(
      Effect.tap(async (response) => {
        expect(response.status).toBe(503);
        const json = await response.json();
        expect(json.error).toBe('OIDC discovery pending');
      }),
    ),
  );

  it.effect('errorToResponse_AllErrors_SetJsonContentType', () => {
    const errors = [
      new AmUnreachable({ kind: 'connection', cause: 'test' }),
      new BffClientError({ status: 422, message: 'test' }),
      new RequestBodyError({ cause: 'test' }),
      new CookieDecryptionFailed({ cookie: '__session', cause: 'test' }),
      new CookieMissing({ cookie: '__session' }),
      new StepMappingError({ message: 'test' }),
      new ServiceUnavailable({ message: 'test' }),
    ];

    return Effect.forEach(errors, (error) =>
      toWebResponse(error).pipe(
        Effect.tap((response) =>
          expect(response.headers.get('content-type')).toBe('application/json'),
        ),
      ),
    );
  });
});

// ─── amResponseToHttp ───────────────────────────────────────────────────────

describe('amResponseToHttp', () => {
  it('amResponseToHttp_ValidAmResponse_SetsStatusAndBody', async () => {
    const body = JSON.stringify({ tokenId: 'abc123' });
    const result = HttpServerResponse.toWeb(
      amResponseToHttp({ status: 200, body, headers: Headers.empty }),
    );

    expect(result.status).toBe(200);
    expect(await result.text()).toBe(body);
  });

  it('amResponseToHttp_ErrorStatus_PreservesStatus', async () => {
    const body = JSON.stringify({ message: 'Unauthorized' });
    const result = HttpServerResponse.toWeb(
      amResponseToHttp({ status: 401, body, headers: Headers.empty }),
    );

    expect(result.status).toBe(401);
    expect(await result.text()).toBe(body);
  });

  it('amResponseToHttp_SetsJsonContentType', () => {
    const result = HttpServerResponse.toWeb(
      amResponseToHttp({ status: 200, body: '{}', headers: Headers.empty }),
    );

    expect(result.headers.get('content-type')).toBe('application/json');
  });
});

// ─── parseAmErrorMessage ──────────────────────────────────────────────────────

describe('parseAmErrorMessage', () => {
  it.effect('parseAmErrorMessage_WithMessage_ReturnsMessage', () =>
    parseAmErrorMessage('{"message":"Invalid creds"}').pipe(
      Effect.tap((msg) => expect(msg).toBe('Invalid creds')),
    ),
  );

  it.effect('parseAmErrorMessage_WithReasonNoMessage_ReturnsReason', () =>
    parseAmErrorMessage('{"reason":"Forbidden"}').pipe(
      Effect.tap((msg) => expect(msg).toBe('Forbidden')),
    ),
  );

  it.effect('parseAmErrorMessage_WithBothFields_PrefersMessage', () =>
    parseAmErrorMessage('{"message":"M","reason":"R"}').pipe(
      Effect.tap((msg) => expect(msg).toBe('M')),
    ),
  );

  it.effect('parseAmErrorMessage_NeitherField_ReturnsDefault', () =>
    parseAmErrorMessage('{"other":"x"}').pipe(
      Effect.tap((msg) => expect(msg).toBe('Authentication failed')),
    ),
  );

  it.effect('parseAmErrorMessage_EmptyBody_ReturnsDefault', () =>
    parseAmErrorMessage('').pipe(Effect.tap((msg) => expect(msg).toBe('Authentication failed'))),
  );

  it.effect('parseAmErrorMessage_MalformedJson_ReturnsDefault', () =>
    parseAmErrorMessage('{ bad').pipe(
      Effect.tap((msg) => expect(msg).toBe('Authentication failed')),
    ),
  );
});

// ─── errorToMessage ──────────────────────────────────────────────────────────

describe('errorToMessage', () => {
  it.effect('errorToMessage_AmUnreachable_ReturnsServiceUnavailable', () =>
    errorToMessage(new AmUnreachable({ kind: 'connection', cause: 'timeout' })).pipe(
      Effect.tap((msg) => expect(msg).toBe('Authentication service unavailable')),
    ),
  );

  it.effect('errorToMessage_AmError_DelegatesParseAmErrorMessage', () =>
    errorToMessage(new AmError({ status: 401, body: '{"message":"Bad"}' })).pipe(
      Effect.tap((msg) => expect(msg).toBe('Bad')),
    ),
  );

  it.effect('errorToMessage_BffClientError_ReturnsMessage', () =>
    errorToMessage(new BffClientError({ status: 400, message: 'Invalid redirect' })).pipe(
      Effect.tap((msg) => expect(msg).toBe('Invalid redirect')),
    ),
  );

  it.effect('errorToMessage_CookieMissing_ReturnsSessionExpired', () =>
    errorToMessage(new CookieMissing({ cookie: '__aid' })).pipe(
      Effect.tap((msg) => expect(msg).toBe('Session expired, please try again')),
    ),
  );

  it.effect('errorToMessage_CookieDecryptionFailed_ReturnsSessionExpired', () =>
    errorToMessage(new CookieDecryptionFailed({ cookie: '__session', cause: 'bad key' })).pipe(
      Effect.tap((msg) => expect(msg).toBe('Session expired, please try again')),
    ),
  );

  it.effect('errorToMessage_RequestBodyError_ReturnsInvalidRequest', () =>
    errorToMessage(new RequestBodyError({ cause: 'parse fail' })).pipe(
      Effect.tap((msg) => expect(msg).toBe('Invalid request')),
    ),
  );

  it.effect('errorToMessage_StepMappingError_ReturnsMessage', () =>
    errorToMessage(new StepMappingError({ message: 'Bad input' })).pipe(
      Effect.tap((msg) => expect(msg).toBe('Bad input')),
    ),
  );

  it.effect('errorToMessage_ServiceUnavailable_ReturnsMessage', () =>
    errorToMessage(new ServiceUnavailable({ message: 'OIDC discovery pending' })).pipe(
      Effect.tap((msg) => expect(msg).toBe('OIDC discovery pending')),
    ),
  );
});

// ─── catchDefect ─────────────────────────────────────────────────────────────

describe('catchDefect', () => {
  const fallbackFn = (ref: string) => new Response(`fallback [ref: ${ref}]`, { status: 500 });

  it.effect('catchDefect_ErrorInstance_ReturnsFallbackWithRef', () =>
    catchDefect(
      'test',
      fallbackFn,
    )(new Error('boom')).pipe(
      Effect.tap(async (result) => {
        expect(result).toBeInstanceOf(Response);
        const text = await result.text();
        expect(text).toMatch(/^fallback \[ref: [a-f0-9]{8}\]$/);
      }),
    ),
  );

  it.effect('catchDefect_NonErrorValue_ReturnsFallbackWithRef', () =>
    catchDefect(
      'test',
      fallbackFn,
    )('string defect').pipe(
      Effect.tap(async (result) => {
        const text = await result.text();
        expect(text).toMatch(/^fallback \[ref: [a-f0-9]{8}\]$/);
      }),
    ),
  );

  it.effect('catchDefect_NullDefect_ReturnsFallbackWithRef', () =>
    catchDefect(
      'test',
      fallbackFn,
    )(null).pipe(
      Effect.tap(async (result) => {
        const text = await result.text();
        expect(text).toMatch(/^fallback \[ref: [a-f0-9]{8}\]$/);
      }),
    ),
  );
});
