/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ building: false }));
vi.mock('$env/dynamic/private', () => ({
  env: {
    FR_AM_URL: 'https://openam.example.com/am',
    FR_AM_COOKIE_NAME: 'am-cookie',
    FR_REALM_PATH: 'alpha',
  },
}));

import { resolveRealmFromUrl } from './redirect.utilities';

describe('resolveRealmFromUrl', () => {
  it('falls back to the configured FR_REALM_PATH when no realm param is present', () => {
    expect(resolveRealmFromUrl(new URL('https://login.example.com/'))).toBe('alpha');
  });

  it('normalizes a leading-slash realm param', () => {
    expect(resolveRealmFromUrl(new URL('https://login.example.com/?realm=/bravo'))).toBe('bravo');
  });

  it("resolves an empty or root-only realm param to 'root'", () => {
    expect(resolveRealmFromUrl(new URL('https://login.example.com/?realm=/'))).toBe('root');
    expect(resolveRealmFromUrl(new URL('https://login.example.com/?realm='))).toBe('root');
  });

  it('falls back to the configured realm when the realm param contains path traversal', () => {
    expect(
      resolveRealmFromUrl(new URL('https://login.example.com/?realm=../../../../global-config')),
    ).toBe('alpha');
  });

  it('falls back to the configured realm when the realm param contains other unsafe characters', () => {
    expect(resolveRealmFromUrl(new URL('https://login.example.com/?realm=alpha/../beta'))).toBe(
      'alpha',
    );
    expect(
      resolveRealmFromUrl(new URL('https://login.example.com/?realm=' + encodeURIComponent('a b'))),
    ).toBe('alpha');
  });
});
