import { pipe } from 'effect';
import { createHash, randomBytes } from 'node:crypto';

import { Brand } from 'effect';

/** Branded type for PKCE code_verifier — prevents accidental misuse as a challenge */
export type CodeVerifier = string & Brand.Brand<'CodeVerifier'>;
export const CodeVerifier = Brand.refined<CodeVerifier>(
  (s) => s.length >= 43 && s.length <= 128,
  (s) => Brand.error(`Invalid code_verifier length: ${s.length}, expected 43-128`),
);

/** Branded type for PKCE code_challenge — prevents accidental misuse as a verifier */
export type CodeChallenge = string & Brand.Brand<'CodeChallenge'>;
export const CodeChallenge = Brand.nominal<CodeChallenge>();

/**
 * Generate a cryptographically random code_verifier (RFC 7636 §4.1).
 * 32 random bytes → 43-character base64url string.
 */
export const generateCodeVerifier = (): CodeVerifier =>
  pipe(randomBytes(32), (bytes) => bytes.toString('base64url'), CodeVerifier);

/**
 * Compute the S256 code_challenge from a code_verifier (RFC 7636 §4.2).
 * SHA-256 hash of the ASCII verifier, base64url-encoded without padding.
 */
export const computeCodeChallenge = (verifier: CodeVerifier): CodeChallenge =>
  pipe(
    createHash('sha256'),
    (hash) => hash.update(verifier),
    (hash) => hash.digest('base64url'),
    CodeChallenge,
  );
