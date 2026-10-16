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
    FR_AM_URL: 'https://openam.example.com/am',
    FR_AM_COOKIE_NAME: 'am-cookie',
    // Leading slash on purpose: resolveRealmFromUrl must normalize this the
    // same way it normalizes a `?realm=` param, or callers see "/alpha" instead
    // of "alpha" whenever they fall back to the configured realm.
    FR_REALM_PATH: '/alpha',
  },
}));

import { createRedirectContext, validateUrl } from './redirect.effects';
import { resolveRealmFromUrl, resolveRedirect } from './redirect.utilities';

afterEach(() => vi.unstubAllGlobals());

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

describe('AM redirect validation', () => {
  const goto = 'https://openam.example.com/am/oauth2/authorize?client_id=mcp&state=fixture';

  it('continues root OAuth after validating through the AIC root action route', async () => {
    const fetch = vi.fn(async (input: string) => {
      const url = new URL(input);
      if (url.searchParams.get('_action') === 'validateGoto') {
        if (url.pathname === '/am/json/realms/root/users') {
          return new Response('{}', { status: 403 });
        }
        expect(url.pathname).toBe('/am/json/users');
        return Response.json({ successURL: goto });
      }
      if (url.pathname.endsWith('/sessions')) {
        return Response.json({ valid: true, uid: 'admin' });
      }
      return Response.json({ roles: ['ui-global-admin'] });
    });
    vi.stubGlobal('fetch', fetch);
    const form = new FormData();
    form.set('loginResult', 'success');
    form.set('tokenId', 'abc123');
    form.set('journeyStepUrl', goto);

    const context = await createRedirectContext(form, { goto, realm: 'root' });

    expect(context.successUrl).toBe(goto);
    expect(resolveRedirect(context)).toBe(goto);
    expect(fetch.mock.calls[0][0]).toBe(
      'https://openam.example.com/am/json/users?_action=validateGoto',
    );
  });

  it.each(['alpha', 'bravo'])('preserves validation in the named %s realm', async (realm) => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ successURL: goto }));
    vi.stubGlobal('fetch', fetch);

    expect(await validateUrl('abc123' as Parameters<typeof validateUrl>[0], goto, realm)).toBe(
      goto,
    );
    expect(fetch.mock.calls[0][0]).toBe(
      `https://openam.example.com/am/json/realms/root/realms/${realm}/users?_action=validateGoto`,
    );
  });

  it.each([null, {}, { successURL: 42 }, { successURL: 'null' }, { successURL: 'undefined' }])(
    'rejects a missing or malformed AM validation result: %j',
    async (response) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(response)));
      expect(await validateUrl('abc123' as Parameters<typeof validateUrl>[0], goto, 'root')).toBe(
        null,
      );
    },
  );
});
