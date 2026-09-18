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
    FR_AM_URL: 'https://am.example.com/am',
    FR_AM_COOKIE_NAME: 'iPlanetDirectoryPro',
    FR_REALM_PATH: 'alpha',
  },
}));

import {
  amProxyResponse,
  getAmCookie,
  resolveJsonRealmPath,
  resolveOAuthRealmPath,
  setAmCookie,
} from './am-session';

function cookies(values: Record<string, string> = {}) {
  return {
    get: (name: string) => values[name],
    set: vi.fn(),
    delete: vi.fn(),
  } as unknown as {
    get: (name: string) => string | undefined;
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

describe('amProxyResponse', () => {
  const makeUpstream = (status: number, body: string | null, contentType?: string) =>
    new Response(body, {
      status,
      headers: contentType ? { 'Content-Type': contentType } : {},
    });

  it('relays status, content-type, and no-store for a normal response', () => {
    const result = amProxyResponse(
      makeUpstream(401, '{"error":"x"}', 'application/json'),
      '{"error":"x"}',
    );

    expect(result.status).toBe(401);
    expect(result.headers.get('content-type')).toBe('application/json');
    expect(result.headers.get('cache-control')).toBe('no-store');
  });

  it('uses a null body for no-body statuses (204/205/304), required by the Response constructor', () => {
    for (const status of [204, 205, 304]) {
      const result = amProxyResponse(makeUpstream(status, null), '');
      expect(result.status).toBe(status);
    }
  });

  it('keeps the body for statuses that allow one', () => {
    const result = amProxyResponse(
      makeUpstream(200, '{"ok":true}', 'application/json'),
      '{"ok":true}',
    );
    expect(result.status).toBe(200);
  });
});
