/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { FR_IDM_THEME_TIMEOUT_MS: undefined } }));
import type * as StyleStore from '$core/style.store';

vi.mock('$core/style.store', async () => {
  const actual = await vi.importActual<typeof StyleStore>('$core/style.store');
  return actual;
});

import { fetchIdmTheme } from './idm-theme.effects';

const IDM_URL = 'https://idm.example.com';
const REALM = 'alpha';

const makeThemeEntry = (overrides: Record<string, unknown> = {}) => ({
  isDefault: true,
  linkedTrees: [] as string[],
  primaryColor: '#cc0000',
  ...overrides,
});

const makeResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchIdmTheme', () => {
  describe('successful fetch', () => {
    it('returns theme for the default entry', async () => {
      vi.mocked(fetch).mockResolvedValue(makeResponse({ realm: { [REALM]: [makeThemeEntry()] } }));

      const result = await fetchIdmTheme(IDM_URL, REALM, null);

      expect(result.theme?.primaryColor).toBe('#cc0000');
      expect(result.backgroundImageUrl).toBeUndefined();
    });

    it('prefers journey-linked theme over default', async () => {
      vi.mocked(fetch).mockResolvedValue(
        makeResponse({
          realm: {
            [REALM]: [
              makeThemeEntry({ isDefault: false, linkedTrees: ['Login'], primaryColor: '#0000ff' }),
              makeThemeEntry({ isDefault: true, primaryColor: '#cc0000' }),
            ],
          },
        }),
      );

      const result = await fetchIdmTheme(IDM_URL, REALM, 'Login');

      expect(result.theme?.primaryColor).toBe('#0000ff');
    });

    it('falls back to default theme when journey name does not match', async () => {
      vi.mocked(fetch).mockResolvedValue(
        makeResponse({
          realm: {
            [REALM]: [
              makeThemeEntry({ isDefault: false, linkedTrees: ['Registration'] }),
              makeThemeEntry({ isDefault: true, primaryColor: '#aabbcc' }),
            ],
          },
        }),
      );

      const result = await fetchIdmTheme(IDM_URL, REALM, 'Login');

      expect(result.theme?.primaryColor).toBe('#aabbcc');
    });

    it('falls back to first theme when no default and no journey match', async () => {
      vi.mocked(fetch).mockResolvedValue(
        makeResponse({
          realm: {
            [REALM]: [makeThemeEntry({ isDefault: false, primaryColor: '#112233' })],
          },
        }),
      );

      const result = await fetchIdmTheme(IDM_URL, REALM, null);

      expect(result.theme?.primaryColor).toBe('#112233');
    });

    it('extracts backgroundImageUrl when valid', async () => {
      vi.mocked(fetch).mockResolvedValue(
        makeResponse({
          realm: {
            [REALM]: [makeThemeEntry({ backgroundImage: 'https://example.com/bg.png' })],
          },
        }),
      );

      const result = await fetchIdmTheme(IDM_URL, REALM, null);

      expect(result.backgroundImageUrl).toBe('https://example.com/bg.png');
    });

    it('omits backgroundImageUrl for non-URL backgroundImage values', async () => {
      vi.mocked(fetch).mockResolvedValue(
        makeResponse({
          realm: {
            [REALM]: [makeThemeEntry({ backgroundImage: '../relative/path.png' })],
          },
        }),
      );

      const result = await fetchIdmTheme(IDM_URL, REALM, null);

      expect(result.backgroundImageUrl).toBeUndefined();
    });

    it('returns undefined theme when no themes exist for realm', async () => {
      vi.mocked(fetch).mockResolvedValue(makeResponse({ realm: {} }));

      const result = await fetchIdmTheme(IDM_URL, 'realm-empty', null);

      expect(result.theme).toBeUndefined();
      expect(result.backgroundImageUrl).toBeUndefined();
    });

    it('constructs IDM URL from base URL correctly', async () => {
      vi.mocked(fetch).mockResolvedValue(makeResponse({ realm: {} }));

      await fetchIdmTheme('https://openam.example.com/am/', REALM, null);

      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        'https://openam.example.com/openidm/config/ui/themerealm',
        expect.objectContaining({ headers: { Accept: 'application/json' } }),
      );
    });

    it('drops invalid hex colors gracefully via themeSchema', async () => {
      vi.mocked(fetch).mockResolvedValue(
        makeResponse({
          realm: {
            [REALM]: [makeThemeEntry({ primaryColor: 'not-a-hex' })],
          },
        }),
      );

      const result = await fetchIdmTheme(IDM_URL, REALM, null);

      expect(result.theme?.primaryColor).toBeUndefined();
    });
  });

  describe('failure handling', () => {
    it('returns empty result on fetch network error (no cache)', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('network failure'));

      const result = await fetchIdmTheme(IDM_URL, 'realm-no-cache-net', null);

      expect(result.theme).toBeUndefined();
      expect(result.backgroundImageUrl).toBeUndefined();
    });

    it('returns empty result on non-ok response (no cache)', async () => {
      vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }));

      const result = await fetchIdmTheme(IDM_URL, 'realm-no-cache-500', null);

      expect(result.theme).toBeUndefined();
    });

    it('returns empty result on invalid JSON (no cache)', async () => {
      vi.mocked(fetch).mockResolvedValue(new Response('not json', { status: 200 }));

      const result = await fetchIdmTheme(IDM_URL, 'realm-no-cache-json', null);

      expect(result.theme).toBeUndefined();
    });

    it('returns cached result on network failure after successful fetch', async () => {
      const cacheRealm = 'realm-cache-net-fail';

      vi.mocked(fetch).mockResolvedValueOnce(
        makeResponse({ realm: { [cacheRealm]: [makeThemeEntry({ primaryColor: '#facade' })] } }),
      );
      await fetchIdmTheme(IDM_URL, cacheRealm, null);

      vi.mocked(fetch).mockRejectedValueOnce(new Error('network failure'));
      const result = await fetchIdmTheme(IDM_URL, cacheRealm, null);

      expect(result.theme?.primaryColor).toBe('#facade');
    });

    it('returns cached result on 500 after successful fetch', async () => {
      const cacheRealm = 'realm-cache-500';

      vi.mocked(fetch).mockResolvedValueOnce(
        makeResponse({ realm: { [cacheRealm]: [makeThemeEntry({ primaryColor: '#abcdef' })] } }),
      );
      await fetchIdmTheme(IDM_URL, cacheRealm, null);

      vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 500 }));
      const result = await fetchIdmTheme(IDM_URL, cacheRealm, null);

      expect(result.theme?.primaryColor).toBe('#abcdef');
    });

    it('uses separate cache entries for different journey names', async () => {
      const cacheRealm = 'realm-cache-journey';

      const body = {
        realm: {
          [cacheRealm]: [
            makeThemeEntry({ isDefault: false, linkedTrees: ['Login'], primaryColor: '#111111' }),
            makeThemeEntry({ isDefault: true, linkedTrees: [], primaryColor: '#222222' }),
          ],
        },
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce(makeResponse(body))
        .mockResolvedValueOnce(makeResponse(body));

      const loginResult = await fetchIdmTheme(IDM_URL, cacheRealm, 'Login');
      const defaultResult = await fetchIdmTheme(IDM_URL, cacheRealm, null);

      expect(loginResult.theme?.primaryColor).toBe('#111111');
      expect(defaultResult.theme?.primaryColor).toBe('#222222');
    });
  });
});
