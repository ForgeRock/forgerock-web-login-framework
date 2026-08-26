/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as redirectEffects from '$server/redirect/redirect.effects';

vi.mock('$app/environment', () => ({ building: false }));
vi.mock('$env/dynamic/private', () => ({
  env: {
    FR_AM_URL: 'https://openam.example.com/am',
    FR_AM_COOKIE_NAME: 'am-cookie',
    FR_REALM_PATH: 'alpha',
  },
}));
vi.mock('$core/_utilities/i18n.utilities', () => ({
  getLocale: () => 'us/en',
}));
vi.mock('$core/locale.store', () => ({
  stringsSchema: { safeParse: () => ({ success: true, data: {} }) },
}));

const validateUrlMock = vi.hoisted(() => vi.fn());
vi.mock('$server/redirect/redirect.effects', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof redirectEffects;
  return { ...actual, validateUrl: (...args: unknown[]) => validateUrlMock(...args) };
});

// #592 moves the AM session helpers from $server/sessions to $server/am-session;
// mock both so the suite passes at either stack position (the am-session mock is
// inert on #502 where nothing imports that module yet).
const { getUserIdFromSessionMock, getUserRolesFromSessionMock, getHttpCookieMock } = vi.hoisted(
  () => ({
    getUserIdFromSessionMock: vi.fn(),
    getUserRolesFromSessionMock: vi.fn(),
    getHttpCookieMock: vi.fn(() => 'token-123'),
  }),
);
vi.mock('$server/sessions', () => ({
  getHttpCookie: getHttpCookieMock,
  getUserIdFromSession: (...args: unknown[]) => getUserIdFromSessionMock(...args),
  getUserRolesFromSession: (...args: unknown[]) => getUserRolesFromSessionMock(...args),
}));
vi.mock('$server/am-session', () => ({
  getHttpCookie: getHttpCookieMock,
  getUserIdFromSession: (...args: unknown[]) => getUserIdFromSessionMock(...args),
  getUserRolesFromSession: (...args: unknown[]) => getUserRolesFromSessionMock(...args),
}));

import { load } from './+page.server';

const AM_ORIGIN = 'https://openam.example.com';

function makeEvent(query = '') {
  return {
    url: new URL(`https://login.example.com/login${query}`),
    request: { headers: new Headers({ 'accept-language': 'en-US' }) },
    cookies: {
      get: () => undefined,
      set: () => {},
      delete: () => {},
      getAll: () => [],
      serialize: () => '',
    },
  } as unknown as Parameters<typeof load>[0];
}

describe('(app)/+page.server.ts pre-flight redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('follows the successUrl AM returns for a trusted authorize goto', async () => {
    getUserIdFromSessionMock.mockResolvedValue('uid-1');
    getUserRolesFromSessionMock.mockResolvedValue(['di-admin']);
    const authorizeUrl = `${AM_ORIGIN}/am/oauth2/realms/root/authorize?client_id=enduser`;
    validateUrlMock.mockResolvedValue(authorizeUrl);

    try {
      await load(makeEvent(`?goto=${encodeURIComponent(authorizeUrl)}`));
      expect.unreachable('expected a redirect');
    } catch (e) {
      expect((e as { location: string }).location).toBe(authorizeUrl);
      expect(validateUrlMock).toHaveBeenCalledWith('token-123', authorizeUrl, 'alpha');
    }
  });

  it('falls through to the role redirect when AM substitutes the default success URL', async () => {
    getUserIdFromSessionMock.mockResolvedValue('uid-1');
    getUserRolesFromSessionMock.mockResolvedValue(['di-admin']);
    const authorizeUrl = `${AM_ORIGIN}/am/oauth2/realms/root/authorize?client_id=enduser`;
    validateUrlMock.mockResolvedValue(`${AM_ORIGIN}/am/ui-runtime/Realm/alpha/Console`);

    await expect(
      load(makeEvent(`?goto=${encodeURIComponent(authorizeUrl)}`)),
    ).rejects.toMatchObject({
      location: expect.stringContaining('/enduser/'),
    });
    expect(validateUrlMock).toHaveBeenCalledWith('token-123', authorizeUrl, 'alpha');
  });

  it('falls through to the role redirect when AM rejects the goto (null successUrl)', async () => {
    getUserIdFromSessionMock.mockResolvedValue('uid-1');
    getUserRolesFromSessionMock.mockResolvedValue(['di-admin']);
    const authorizeUrl = `${AM_ORIGIN}/am/oauth2/realms/root/authorize?client_id=enduser`;
    validateUrlMock.mockResolvedValue(null);

    await expect(
      load(makeEvent(`?goto=${encodeURIComponent(authorizeUrl)}`)),
    ).rejects.toMatchObject({
      location: expect.stringContaining('/enduser/'),
    });
  });

  it('never redirects to a cross-origin goto even when it looks like an authorize URL', async () => {
    getUserIdFromSessionMock.mockResolvedValue('uid-1');
    getUserRolesFromSessionMock.mockResolvedValue(['di-admin']);
    const evilUrl = 'https://evil.example.com/am/oauth2/realms/root/authorize';
    validateUrlMock.mockResolvedValue(evilUrl);

    await expect(load(makeEvent(`?goto=${encodeURIComponent(evilUrl)}`))).rejects.toMatchObject({
      location: expect.stringContaining('/enduser/'),
    });
    expect(validateUrlMock).not.toHaveBeenCalled();
  });

  it('falls through to the role redirect for a non-authorize same-origin goto', async () => {
    getUserIdFromSessionMock.mockResolvedValue('uid-1');
    getUserRolesFromSessionMock.mockResolvedValue(['di-admin']);

    await expect(
      load(makeEvent(`?goto=${encodeURIComponent('/platform/profile')}`)),
    ).rejects.toMatchObject({
      location: expect.stringContaining('/enduser/'),
    });
    expect(validateUrlMock).not.toHaveBeenCalled();
  });
});
