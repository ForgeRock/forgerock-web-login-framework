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

const logMock = vi.hoisted(() => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}));
vi.mock('$server/logger.effects', () => ({ log: logMock }));

const validateGotoMock = vi.hoisted(() => vi.fn());

// #592 moves the AM session helpers from $server/sessions to $server/am-session;
// mock both so the suite passes at either stack position (the am-session mock is
// inert on #502 where nothing imports that module yet).
const { getUserRolesFromSessionMock, getHttpCookieMock } = vi.hoisted(() => ({
  getUserRolesFromSessionMock: vi.fn(),
  getHttpCookieMock: vi.fn(() => 'token-123'),
}));
vi.mock('$server/sessions', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    getHttpCookie: getHttpCookieMock,
    getUserRolesFromSession: (...args: unknown[]) => getUserRolesFromSessionMock(...args),
  };
});
vi.mock('$server/redirect/redirect.effects', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof redirectEffects;
  return { ...actual, validateGoto: (...args: unknown[]) => validateGotoMock(...args) };
});
vi.mock('$server/am-session', () => ({
  getHttpCookie: getHttpCookieMock,
  getUserRolesFromSession: (...args: unknown[]) => getUserRolesFromSessionMock(...args),
}));

import { load } from './+page.server';

const AM_ORIGIN = 'https://openam.example.com';

function makeEvent(
  query = '',
  { matched = false, arrivalOrigin = 'https://login.example.com' } = {},
) {
  return {
    url: new URL(`${arrivalOrigin}/login${query}`),
    request: { headers: new Headers({ 'accept-language': 'en-US' }) },
    parent: async () => ({ matched }),
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
    // Defaults: live session; amOrigin is the configured AM origin.
    getUserRolesFromSessionMock.mockResolvedValue({
      userId: 'uid-1',
      roles: [],
      unreachable: false,
    });
  });

  it('follows the validated URL AM returns for a trusted authorize goto', async () => {
    getUserRolesFromSessionMock.mockResolvedValue({
      userId: 'uid-1',
      roles: ['di-admin'],
      unreachable: false,
    });
    const authorizeUrl = `${AM_ORIGIN}/am/oauth2/realms/root/authorize?client_id=enduser`;
    validateGotoMock.mockResolvedValue(authorizeUrl);

    try {
      await load(makeEvent(`?goto=${encodeURIComponent(authorizeUrl)}`));
      expect.unreachable('expected a redirect');
    } catch (e) {
      expect((e as { location: string }).location).toBe(authorizeUrl);
      expect(validateGotoMock).toHaveBeenCalledWith('token-123', authorizeUrl, 'alpha');
      expect(logMock.warn).not.toHaveBeenCalled();
    }
  });

  it('falls through to the role redirect when AM substitutes the default success URL', async () => {
    const authorizeUrl = `${AM_ORIGIN}/am/oauth2/realms/root/authorize?client_id=enduser`;
    validateGotoMock.mockResolvedValue(`${AM_ORIGIN}/am/ui-runtime/Realm/alpha/Console`);

    await expect(
      load(makeEvent(`?goto=${encodeURIComponent(authorizeUrl)}`)),
    ).rejects.toMatchObject({
      location: expect.stringContaining('/enduser/'),
    });
    expect(validateGotoMock).toHaveBeenCalledWith('token-123', authorizeUrl, 'alpha');
    expect(logMock.warn).toHaveBeenCalledTimes(1);
    expect(logMock.warn).toHaveBeenCalledWith(
      '[redirect] AM did not trust goto, using role redirect',
      {
        goto: `${AM_ORIGIN}/am/oauth2/realms/root/authorize`,
        realm: 'alpha',
      },
    );
  });

  it('falls through to the role redirect when AM rejects the goto (null validatedUrl)', async () => {
    const authorizeUrl = `${AM_ORIGIN}/am/oauth2/realms/root/authorize?client_id=enduser`;
    validateGotoMock.mockResolvedValue(null);

    await expect(
      load(makeEvent(`?goto=${encodeURIComponent(authorizeUrl)}`)),
    ).rejects.toMatchObject({
      location: expect.stringContaining('/enduser/'),
    });
    expect(logMock.warn).not.toHaveBeenCalled();
  });

  it('defers to AM when the goto is authorize-shaped on a non-AM origin', async () => {
    // Origin trust is AM's redirect-validation registry (as in platform-login's
    // verifyGotoUrlAndRedirect): the gate sends any authorize-shaped URL to
    // validateGoto and follows it only when AM echoes it back unchanged.
    const crossOriginAuthorize = 'https://sso.partner.example/am/oauth2/authorize';
    validateGotoMock.mockResolvedValue(`${crossOriginAuthorize}#substituted`);

    await expect(
      load(makeEvent(`?goto=${encodeURIComponent(crossOriginAuthorize)}`)),
    ).rejects.toMatchObject({
      location: expect.stringContaining('/enduser/'),
    });
    expect(validateGotoMock).toHaveBeenCalledWith('token-123', crossOriginAuthorize, 'alpha');
    expect(logMock.warn).toHaveBeenCalledTimes(1);
  });

  it('falls through to the role redirect for a non-authorize same-origin goto', async () => {
    await expect(
      load(makeEvent(`?goto=${encodeURIComponent('/platform/profile')}`)),
    ).rejects.toMatchObject({
      location: expect.stringContaining('/enduser/'),
    });
    expect(validateGotoMock).not.toHaveBeenCalled();
  });

  it('follows an absolute-URL authorize goto regardless of the arrival origin', async () => {
    // The OAuth gate trusts AM's redirect-validation registry, not the arrival
    // origin — SP-initiated OAuth keeps working from any configured origin.
    const authorizeUrl = `${AM_ORIGIN}/am/oauth2/realms/root/authorize?client_id=enduser`;
    validateGotoMock.mockResolvedValue(authorizeUrl);

    await expect(
      load(makeEvent(`?goto=${encodeURIComponent(authorizeUrl)}`)),
    ).rejects.toMatchObject({ location: authorizeUrl });
    expect(validateGotoMock).toHaveBeenCalledWith('token-123', authorizeUrl, 'alpha');
  });

  it('falls through to the console when AM refuses an authorize-shaped goto on another host', async () => {
    // AM returns null (or a substituted default) for URLs outside its
    // redirect-validation registry — the echo check then fails and the user
    // takes the console redirect instead.
    const unregisteredAuthorize = 'https://unregistered.example.com/am/oauth2/authorize';
    validateGotoMock.mockResolvedValue(null);

    await expect(
      load(makeEvent(`?goto=${encodeURIComponent(unregisteredAuthorize)}`)),
    ).rejects.toMatchObject({
      location: expect.stringContaining('/enduser/'),
    });
    expect(validateGotoMock).toHaveBeenCalledWith('token-123', unregisteredAuthorize, 'alpha');
  });
});
