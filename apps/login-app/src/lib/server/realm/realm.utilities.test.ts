/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
  env: {
    FR_AM_URL: 'https://am.example.com/am',
    FR_AM_COOKIE_NAME: 'iPlanetDirectoryPro',
    FR_REALM_PATH: 'alpha',
  },
}));

import {
  normalizeRealm,
  originIsCustomDomain,
  originIsDefaultDomain,
  resolveJsonRealmPath,
  resolveOAuthRealmPath,
} from './realm.utilities';

describe('realm paths', () => {
  it('uses the configured realm when no override is provided', () => {
    expect(resolveJsonRealmPath()).toBe('/json/realms/root/realms/alpha');
  });

  it('supports root and named realm overrides', () => {
    expect(resolveJsonRealmPath('/')).toBe('/json/realms/root');
    expect(resolveJsonRealmPath('/bravo')).toBe('/json/realms/root/realms/bravo');
    expect(resolveOAuthRealmPath('/bravo')).toBe('/oauth2/realms/root/realms/bravo');
  });

  it('uses the root realm for explicit root overrides', () => {
    expect(resolveJsonRealmPath('/')).toBe('/json/realms/root');
    expect(resolveJsonRealmPath('/root')).toBe('/json/realms/root');
  });

  it('rejects path traversal and falls back for malformed overrides', () => {
    expect(resolveJsonRealmPath('../../global-config')).toBe('/json/realms/root');
    expect(resolveJsonRealmPath('alpha/../bravo')).toBe('/json/realms/root');
  });
});

describe('normalizeRealm', () => {
  it('strips leading slashes and defaults empty values to root', () => {
    expect(normalizeRealm('/alpha')).toBe('alpha');
    expect(normalizeRealm('/')).toBe('root');
    expect(normalizeRealm(undefined)).toBe('root');
    expect(normalizeRealm(null)).toBe('root');
  });
});

describe('origin predicates', () => {
  it('classifies a probed realm as default domain only for root', () => {
    expect(originIsDefaultDomain('root')).toBe(true);
    expect(originIsDefaultDomain('alpha')).toBe(false);
    expect(originIsDefaultDomain(null)).toBe(false);
  });

  it('classifies a probed realm as custom domain for any named realm', () => {
    expect(originIsCustomDomain('alpha')).toBe(true);
    expect(originIsCustomDomain('root')).toBe(false);
    expect(originIsCustomDomain(null)).toBe(false);
  });
});
