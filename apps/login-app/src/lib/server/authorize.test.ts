import { Effect } from 'effect';
import { it, describe, expect } from '@effect/vitest';

import { buildAuthorizeQuery, validateRedirectOrigin } from '$server/authorize';

// ─── buildAuthorizeQuery ────────────────────────────────────────────────────

describe('buildAuthorizeQuery', () => {
  // Verifiers must be 43-128 characters per RFC 7636 §4.1 (enforced by Brand.refined)
  const validVerifier1 = 'test-verifier-padded-to-meet-minimum-length-43';
  const validVerifier2 = 'diff-verifier-padded-to-meet-minimum-length-43';

  it('buildAuthorizeQuery_ValidInputs_SetsAllRequiredParams', () => {
    const result = buildAuthorizeQuery('', validVerifier1, 'my-client');
    const params = new URLSearchParams(result);

    expect(params.get('code_challenge')).toBeTruthy();
    expect(params.get('code_challenge_method')).toBe('S256');
    expect(params.get('client_id')).toBe('my-client');
    expect(params.get('response_type')).toBe('code');
  });

  it('buildAuthorizeQuery_ExistingSearchParams_PreservesOriginalParams', () => {
    const result = buildAuthorizeQuery(
      '?scope=openid&redirect_uri=http://app/callback',
      validVerifier1,
      'client',
    );
    const params = new URLSearchParams(result);

    expect(params.get('scope')).toBe('openid');
    expect(params.get('redirect_uri')).toBe('http://app/callback');
    expect(params.get('client_id')).toBe('client');
  });

  it('buildAuthorizeQuery_DifferentVerifiers_ProduceDifferentChallenges', () => {
    const result1 = buildAuthorizeQuery('', validVerifier1, 'client');
    const result2 = buildAuthorizeQuery('', validVerifier2, 'client');
    const challenge1 = new URLSearchParams(result1).get('code_challenge');
    const challenge2 = new URLSearchParams(result2).get('code_challenge');

    expect(challenge1).not.toBe(challenge2);
  });
});

// ─── validateRedirectOrigin ─────────────────────────────────────────────────

describe('validateRedirectOrigin', () => {
  it.effect('validateRedirectOrigin_SameOrigin_ReturnsUrl', () => {
    const url = 'https://app.example.com/callback?code=abc';
    return validateRedirectOrigin(url, 'https://app.example.com').pipe(
      Effect.tap((result) => expect(result).toBe(url)),
    );
  });

  it.effect('validateRedirectOrigin_OriginMismatch_FailsWithBffClientError', () =>
    validateRedirectOrigin('https://evil.com/steal', 'https://app.example.com').pipe(
      Effect.flip,
      Effect.tap((e) => {
        expect(e._tag).toBe('BffClientError');
        expect(e.message).toBe('Redirect URL origin mismatch');
      }),
    ),
  );

  it.effect('validateRedirectOrigin_MalformedUrl_FailsWithBffClientError', () =>
    validateRedirectOrigin('not-a-url', 'https://app.example.com').pipe(
      Effect.flip,
      Effect.tap((e) => {
        expect(e._tag).toBe('BffClientError');
        expect(e.message).toBe('AM returned invalid redirect URL');
      }),
    ),
  );

  it.effect('validateRedirectOrigin_ProtocolMismatch_FailsWithBffClientError', () =>
    validateRedirectOrigin('http://app.example.com/callback', 'https://app.example.com').pipe(
      Effect.flip,
      Effect.tap((e) => {
        expect(e._tag).toBe('BffClientError');
        expect(e.message).toBe('Redirect URL origin mismatch');
      }),
    ),
  );

  it.effect('validateRedirectOrigin_PortMismatch_FailsWithBffClientError', () =>
    validateRedirectOrigin('https://app.example.com:8443/callback', 'https://app.example.com').pipe(
      Effect.flip,
      Effect.tap((e) => {
        expect(e._tag).toBe('BffClientError');
        expect(e.message).toBe('Redirect URL origin mismatch');
      }),
    ),
  );
});
