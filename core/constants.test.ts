/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ building: true }));

/**
 * constants.ts derives JSON_REALM_PATH / OAUTH_REALM_PATH from FR_REALM_PATH at
 * module import, so each case re-imports the module with its own env mock.
 */
async function importConstants(env: Record<string, string | undefined>) {
  vi.resetModules();
  vi.doMock('$env/dynamic/private', () => ({ env }));
  return await import('./constants.ts');
}

afterEach(() => {
  vi.doUnmock('$env/dynamic/private');
  vi.resetModules();
});

describe('realm path derivation from FR_REALM_PATH', () => {
  it('derives the configured realm path without a leading slash', async () => {
    const constants = await importConstants({ FR_REALM_PATH: 'alpha' });
    expect(constants.JSON_REALM_PATH).toBe('/json/realms/root/realms/alpha');
    expect(constants.OAUTH_REALM_PATH).toBe('/oauth2/realms/root/realms/alpha');
  });

  it('normalizes a leading slash in FR_REALM_PATH like ?realm= overrides', async () => {
    const constants = await importConstants({ FR_REALM_PATH: '/alpha' });
    expect(constants.JSON_REALM_PATH).toBe('/json/realms/root/realms/alpha');
    expect(constants.OAUTH_REALM_PATH).toBe('/oauth2/realms/root/realms/alpha');
  });

  it('strips a trailing slash from FR_AM_URL', async () => {
    const constants = await importConstants({
      FR_AM_URL: 'https://am.example.com/am/',
      FR_REALM_PATH: 'alpha',
    });
    expect(constants.AM_DOMAIN_PATH).toBe('https://am.example.com/am');
  });

  it('falls back to the bare root paths when FR_REALM_PATH is unset', async () => {
    const constants = await importConstants({});
    expect(constants.JSON_REALM_PATH).toBe('/json/realms/root/');
  });
});
