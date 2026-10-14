/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const { logMock, sessionsMock } = vi.hoisted(() => ({
  logMock: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  sessionsMock: {
    amFetchRequest: vi.fn(),
    getHttpCookie: vi.fn(),
    getUserRolesFromSession: vi.fn(),
    removeHttpCookie: vi.fn(),
    setHttpCookie: vi.fn(),
  },
}));
vi.mock('$server/logger.effects', () => ({ log: logMock }));
vi.mock('$server/sessions', () => sessionsMock);

import { tokenIdSchema } from '$server/schemas';
import { readAndClearRedirectCookie, validateUrl } from './redirect.effects';
import { resolveRealmFromUrl } from './redirect.utilities';

import type { RequestEvent } from '@sveltejs/kit';

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

describe('readAndClearRedirectCookie', () => {
  const event = { cookies: {} } as unknown as RequestEvent;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the stored params without warning', () => {
    sessionsMock.getHttpCookie.mockReturnValue(
      JSON.stringify({ goto: 'https://app.example.com/cb', gotoOnFail: '/failed', realm: 'alpha' }),
    );

    expect(readAndClearRedirectCookie(event)).toEqual({
      goto: 'https://app.example.com/cb',
      gotoOnFail: '/failed',
      realm: 'alpha',
    });
    expect(sessionsMock.removeHttpCookie).toHaveBeenCalledTimes(1);
    expect(logMock.warn).not.toHaveBeenCalled();
  });

  it('returns nothing without warning when there is no cookie', () => {
    sessionsMock.getHttpCookie.mockReturnValue(undefined);

    expect(readAndClearRedirectCookie(event)).toEqual({});
    expect(logMock.warn).not.toHaveBeenCalled();
  });

  it.each(['{not json', JSON.stringify({ goto: 42 })])(
    'ignores a malformed cookie with one warning that does not echo it: %s',
    (cookieValue) => {
      sessionsMock.getHttpCookie.mockReturnValue(cookieValue);

      expect(readAndClearRedirectCookie(event)).toEqual({});
      expect(logMock.warn).toHaveBeenCalledTimes(1);
      expect(logMock.warn).toHaveBeenCalledWith('[redirect] ignoring malformed redirect cookie');
    },
  );
});

describe('validateUrl', () => {
  const tokenId = tokenIdSchema.parse('session-token');
  const goto = 'https://app.example.com/cb?state=opaque-state&login_hint=user@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the successUrl AM validated without warning', async () => {
    sessionsMock.amFetchRequest.mockResolvedValue({ successUrl: 'https://app.example.com/cb' });

    expect(await validateUrl(tokenId, goto, 'alpha')).toBe('https://app.example.com/cb');
    expect(logMock.warn).not.toHaveBeenCalled();
  });

  it.each([null, {}, { successUrl: '' }, { successUrl: 'undefined' }, { successUrl: 'null' }])(
    'warns with the goto origin and path only when AM gives no usable successUrl: %j',
    async (response) => {
      sessionsMock.amFetchRequest.mockResolvedValue(response);

      expect(await validateUrl(tokenId, goto, 'alpha')).toBeNull();
      expect(logMock.warn).toHaveBeenCalledTimes(1);
      expect(logMock.warn).toHaveBeenCalledWith(
        '[redirect] goto validation returned no usable successUrl',
        { goto: 'https://app.example.com/cb', realm: 'alpha' },
      );
    },
  );
});
