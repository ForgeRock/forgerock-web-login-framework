import { describe, expect, it } from 'vitest';

import { CodeVerifier, computeCodeChallenge, generateCodeVerifier } from './pkce';

describe('generateCodeVerifier', () => {
  it('generateCodeVerifier_Called_Returns43CharBase64UrlString', () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toHaveLength(43);
    // base64url charset: A-Z a-z 0-9 - _
    expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it('generateCodeVerifier_CalledTwice_ProducesDifferentValues', () => {
    const v1 = generateCodeVerifier();
    const v2 = generateCodeVerifier();
    expect(v1).not.toBe(v2);
  });
});

describe('computeCodeChallenge', () => {
  it('computeCodeChallenge_Rfc7636AppendixBVector_ReturnsExpectedChallenge', () => {
    // RFC 7636 Appendix B test vector
    const verifier = CodeVerifier('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
    const challenge = computeCodeChallenge(verifier);
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('computeCodeChallenge_SameInput_ReturnsDeterministicOutput', () => {
    const verifier = CodeVerifier('test-verifier-for-determinism-check-padded-to-43');
    const c1 = computeCodeChallenge(verifier);
    const c2 = computeCodeChallenge(verifier);
    expect(c1).toBe(c2);
  });

  it('computeCodeChallenge_DifferentInputs_ReturnDifferentChallenges', () => {
    const v1 = CodeVerifier('verifier-one-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    const v2 = CodeVerifier('verifier-two-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    expect(computeCodeChallenge(v1)).not.toBe(computeCodeChallenge(v2));
  });
});
