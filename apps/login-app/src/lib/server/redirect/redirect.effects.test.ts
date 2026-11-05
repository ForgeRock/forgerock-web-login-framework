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
    // Leading slash on purpose: resolveRequestedRealm must normalize this the
    // same way it normalizes a `?realm=` param, or callers see "/alpha" instead
    // of "alpha" whenever they fall back to the configured realm.
    FR_REALM_PATH: '/alpha',
  },
}));

import { createRedirectContext, resolveRedirectOrigin, validateUrl } from './redirect.effects';
import { resolveRedirect, resolveRequestedRealm } from './redirect.utilities';

afterEach(() => vi.unstubAllGlobals());

describe('resolveRequestedRealm', () => {
  it('falls back to the configured realm when no realm param is present', () => {
    expect(resolveRequestedRealm(new URL('https://login.example.com/'), '/alpha')).toBe('alpha');
  });

  it('normalizes a leading-slash realm param', () => {
    expect(
      resolveRequestedRealm(new URL('https://login.example.com/?realm=/bravo'), '/alpha'),
    ).toBe('bravo');
  });

  it("resolves an empty or root-only realm param to 'root'", () => {
    expect(resolveRequestedRealm(new URL('https://login.example.com/?realm=/'), '/alpha')).toBe(
      'root',
    );
    expect(resolveRequestedRealm(new URL('https://login.example.com/?realm='), '/alpha')).toBe(
      'root',
    );
  });

  it('falls back to the configured realm when the realm param contains path traversal', () => {
    expect(
      resolveRequestedRealm(
        new URL('https://login.example.com/?realm=../../../../global-config'),
        '/alpha',
      ),
    ).toBe('alpha');
  });

  it('falls back to the configured realm when the realm param contains other unsafe characters', () => {
    expect(
      resolveRequestedRealm(new URL('https://login.example.com/?realm=alpha/../beta'), '/alpha'),
    ).toBe('alpha');
    expect(
      resolveRequestedRealm(
        new URL('https://login.example.com/?realm=' + encodeURIComponent('a b')),
        '/alpha',
      ),
    ).toBe('alpha');
  });
});

describe('resolveRedirectOrigin', () => {
  const serverinfoResponse = (realm: string) =>
    Promise.resolve(new Response(JSON.stringify({ realm })));

  it('stays on the arrival origin when its serverinfo aliases to the requested realm (custom domain)', async () => {
    const fetch = vi.fn((input: string) => {
      if (input.includes('/json/serverinfo/*')) {
        return serverinfoResponse('/alpha');
      }
      throw new Error(`unexpected fetch: ${input}`);
    });
    vi.stubGlobal('fetch', fetch);

    const origin = await resolveRedirectOrigin('https://id.petrov.ca', 'alpha');

    expect(origin).toBe('https://id.petrov.ca');
    expect(fetch.mock.calls[0][0]).toBe('https://id.petrov.ca/am/json/serverinfo/*');
  });

  it('falls back to the configured AM origin when the arrival host is not AM-served (separate-origin app)', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response('<html>404</html>')));
    vi.stubGlobal('fetch', fetch);

    const origin = await resolveRedirectOrigin('https://app.example.com', 'alpha');

    expect(origin).toBe('https://openam.example.com');
  });

  it('falls back to the configured AM origin when the arrival alias differs from the requested realm', async () => {
    const fetch = vi.fn((input: string) => {
      if (input.includes('/json/serverinfo/*')) {
        return serverinfoResponse('/');
      }
      throw new Error(`unexpected fetch: ${input}`);
    });
    vi.stubGlobal('fetch', fetch);

    const origin = await resolveRedirectOrigin('https://tenant.example.com', 'alpha');

    expect(origin).toBe('https://openam.example.com');
  });

  it('returns the AM origin without probing when arrival already is the AM origin', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);

    const origin = await resolveRedirectOrigin('https://openam.example.com', 'alpha');

    expect(origin).toBe('https://openam.example.com');
    expect(fetch).not.toHaveBeenCalled();
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

    const context = await createRedirectContext(
      form,
      { goto, realm: 'root' },
      'https://login.example.com',
    );

    expect(context.successUrl).toBe(goto);
    expect(resolveRedirect(context)).toBe(goto);
    expect(fetch.mock.calls[0][0]).toBe(
      'https://openam.example.com/am/json/users?_action=validateGoto',
    );
  });

  it('prefers the journey realm from the form over the cookie realm', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ roles: [] }));
    vi.stubGlobal('fetch', fetch);
    const form = new FormData();
    form.set('loginResult', 'success');
    form.set('tokenId', 'abc123');
    form.set('journeyStepUrl', '');
    form.set('realm', 'bravo');

    const context = await createRedirectContext(
      form,
      { realm: 'alpha' },
      'https://login.example.com',
    );

    expect(context.realm).toBe('bravo');
    expect(fetch.mock.calls[0][0]).toBe(
      'https://openam.example.com/am/json/realms/root/realms/bravo/sessions?_action=validate',
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
