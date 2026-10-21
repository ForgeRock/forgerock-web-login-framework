/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ building: false }));
vi.mock('$env/dynamic/private', () => ({
  env: {
    FR_AM_URL: 'https://am.example.com/am',
    FR_AM_COOKIE_NAME: 'iPlanetDirectoryPro',
    FR_REALM_PATH: 'alpha',
  },
}));

import {
  amFetchRequest,
  getAmCookie,
  resolveJsonRealmPath,
  resolveOAuthRealmPath,
  setAmCookie,
} from './sessions';

afterEach(() => vi.unstubAllGlobals());

function cookies(values: Record<string, string> = {}) {
  return {
    get: (name: string) => values[name],
    getAll: () => Object.entries(values).map(([name, value]) => ({ name, value })),
    serialize: (name: string, value: string) => `${name}=${value}`,
    set: vi.fn(),
    delete: vi.fn(),
  } as unknown as {
    get: (name: string) => string | undefined;
    getAll: () => Array<{ name: string; value: string }>;
    serialize: (name: string, value: string) => string;
    set: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
}

describe('Login2 session cookie forwarding', () => {
  it('forwards only the configured AM cookie', () => {
    expect(getAmCookie(cookies({ iPlanetDirectoryPro: 'session-token', other: 'ignored' }))).toBe(
      'iPlanetDirectoryPro=session-token',
    );
  });

  it('stores an upstream AM cookie without its upstream domain', () => {
    const target = cookies();

    setAmCookie(
      target,
      'iPlanetDirectoryPro=session-token; Path=/; Domain=am.example.com; Secure; HttpOnly',
    );

    expect(target.set).toHaveBeenCalledWith('iPlanetDirectoryPro', 'session-token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });
  });

  it('clears an upstream AM cookie with an empty value', () => {
    const target = cookies();

    setAmCookie(target, 'iPlanetDirectoryPro=; Path=/; Max-Age=0');

    expect(target.delete).toHaveBeenCalledWith('iPlanetDirectoryPro', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });
  });

  it('reads the AM cookie out of a multi-cookie header with Expires dates', () => {
    const target = cookies();

    setAmCookie(
      target,
      'other=abc; Expires=Wed, 21 Oct 2026 07:28:00 GMT, iPlanetDirectoryPro=session-token; Path=/; Expires=Thu, 22 Oct 2026 07:28:00 GMT',
    );

    expect(target.set).toHaveBeenCalledWith('iPlanetDirectoryPro', 'session-token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });
  });
});

describe('Login2 realm paths', () => {
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
    expect(resolveJsonRealmPath('../../global-config')).toBe('/json/realms/root/realms/alpha');
    expect(resolveJsonRealmPath('alpha/../bravo')).toBe('/json/realms/root/realms/alpha');
  });
});

describe('Root redirect validation transport', () => {
  it.each(['/', 'root', '/root'])('uses the root action alias for %s only', async (realm) => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ successURL: '/platform/' }));
    vi.stubGlobal('fetch', fetch);

    await amFetchRequest(
      'abc123' as Parameters<typeof amFetchRequest>[0],
      '/users?_action=validateGoto',
      'POST',
      { goto: '/platform/' },
      realm,
    );

    expect(fetch.mock.calls[0][0]).toBe(
      'https://am.example.com/am/json/users?_action=validateGoto',
    );
    expect(fetch.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: { cookie: 'iPlanetDirectoryPro=abc123' },
      body: JSON.stringify({ goto: '/platform/' }),
    });
  });

  it('preserves the qualified root path for other AM operations', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ valid: true }));
    vi.stubGlobal('fetch', fetch);

    await amFetchRequest(
      'abc123' as Parameters<typeof amFetchRequest>[0],
      '/sessions?_action=validate',
      'POST',
      undefined,
      'root',
    );

    expect(fetch.mock.calls[0][0]).toBe(
      'https://am.example.com/am/json/realms/root/sessions?_action=validate',
    );
  });
});
