/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { type ThemeObject, themeSchema, urlRegex } from '$core/style.store';
import { env } from '$env/dynamic/private';

interface IdmThemeEntry {
  _id?: string;
  isDefault?: boolean;
  linkedTrees?: string[];
  primaryColor?: string;
  primaryOffColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  linkColor?: string;
  linkActiveColor?: string;
  buttonRounded?: number | string;
  favicon?: string;
  logo?: string;
  logoEnabled?: boolean;
  logoHeight?: number | string;
  fontFamily?: string;
  journeyCardBorderRadius?: number | string;
  journeyCardBackgroundColor?: string;
  journeyInputBackgroundColor?: string;
  journeyInputBorderColor?: string;
  journeyInputLabelColor?: string;
  journeyInputFocusBorderColor?: string;
  journeyInputSelectColor?: string;
  journeyInputSelectHoverColor?: string;
  buttonFocusBorderColor?: string;
  journeyInputTextColor?: string;
  journeyCardTextColor?: string;
  bodyText?: string;
  textColor?: string;
}

interface IdmThemeRealmResponse {
  realm?: Record<string, IdmThemeEntry[]>;
}

export interface IdmThemeResult {
  theme: ThemeObject | undefined;
  themeCatalog: Record<string, ThemeObject>;
  backgroundImageUrl: string | undefined;
}

/**
 * Theme fetches block SSR rendering, so the IDM request is given a short
 * timeout. On any failure the last successful result for the same
 * realm + journey is reused, which is more accurate than falling back to the
 * widget defaults. The cache is module-level and lives for the server process.
 *
 * The default of 1500ms covers a co-located login-app/IDM deployment where the
 * themerealm payload (~136KB) can take 300-500ms. For tighter latency budgets,
 * lower it via `FR_IDM_THEME_TIMEOUT_MS`.
 */
const DEFAULT_IDM_FETCH_TIMEOUT_MS = 1500;

/**
 * The cache is keyed on unauthenticated request input (`?journey=` reaches
 * here verbatim), so an attacker can grow it arbitrarily by varying the
 * parameter unless it is bounded. Entries expire after an idle TTL, refreshed
 * on every hit, and the map holds at most MAX_CACHE_ENTRIES keys, evicting the
 * least-recently-used entry only when a NEW key is inserted (Map iteration
 * order is insertion order; a delete + set moves the key to the end, giving
 * the LRU behavior for free). Refreshing an already-cached key never evicts.
 *
 * When IDM answers 200 but holds no usable theme for the realm, the previously
 * cached value keeps serving: each such fallback hit refreshes the idle TTL,
 * so the stale value is replaced the moment IDM returns a matched theme again
 * and is dropped once the key goes without a request for CACHE_TTL_MS.
 * Availability is preferred over freshness here, so a delete-everything blip
 * on the IDM side cannot blank the login page while requests keep coming.
 * Keys are `realm::journey`, so each unknown journey name holds its own slot,
 * bounded by the cap.
 */
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 64;

interface CacheEntry {
  readonly result: IdmThemeResult;
  readonly cachedAt: number;
}

const themeCache = new Map<string, CacheEntry>();

/** Re-inserts a key at the end of the Map, the LRU "most recently used" slot. */
const touchEntry = (key: string, entry: CacheEntry): void => {
  themeCache.delete(key);
  themeCache.set(key, entry);
};

function cacheGet(key: string): IdmThemeResult | undefined {
  const entry = themeCache.get(key);
  if (entry === undefined) {
    return undefined;
  }
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    themeCache.delete(key);
    return undefined;
  }
  // Idle TTL refreshed on a hit: delete + set renews cachedAt and moves the
  // key to the end of the Map.
  const refreshed: CacheEntry = { result: entry.result, cachedAt: Date.now() };
  touchEntry(key, refreshed);
  return refreshed.result;
}

function cacheSet(key: string, result: IdmThemeResult): void {
  const exists = themeCache.has(key);
  if (!exists) {
    while (themeCache.size >= MAX_CACHE_ENTRIES) {
      const oldest = themeCache.keys().next().value;
      if (oldest === undefined) {
        break;
      }
      themeCache.delete(oldest);
    }
  }
  const entry: CacheEntry = { result, cachedAt: Date.now() };
  if (exists) {
    touchEntry(key, entry);
    return;
  }
  themeCache.set(key, entry);
}

function resolveTimeoutMs(): number {
  const parsed = Number(env.FR_IDM_THEME_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_IDM_FETCH_TIMEOUT_MS;
}

function toIdmTheme(entry: IdmThemeEntry): ThemeObject | undefined {
  const logoEnabled = entry.logoEnabled !== false;
  const raw = {
    primaryColor: entry.primaryColor,
    primaryOffColor: entry.primaryOffColor,
    secondaryColor: entry.secondaryColor,
    backgroundColor: entry.backgroundColor,
    linkColor: entry.linkColor,
    linkActiveColor: entry.linkActiveColor,
    favicon: urlRegex.test(entry.favicon ?? '') ? entry.favicon : undefined,
    logo: logoEnabled ? entry.logo : undefined,
    logoHeight:
      logoEnabled && entry.logoHeight !== undefined ? Number(entry.logoHeight) : undefined,
    fontFamily: entry.fontFamily,
    buttonBorderRadius: entry.buttonRounded !== undefined ? Number(entry.buttonRounded) : undefined,
    cardBorderRadius:
      entry.journeyCardBorderRadius !== undefined
        ? Number(entry.journeyCardBorderRadius)
        : undefined,
    cardBgColor: entry.journeyCardBackgroundColor,
    inputBgColor: entry.journeyInputBackgroundColor,
    inputBorderColor: entry.journeyInputBorderColor,
    inputLabelColor: entry.journeyInputLabelColor,
    inputFocusRingColor: entry.journeyInputFocusBorderColor,
    selectAccentColor: entry.journeyInputSelectColor,
    selectHoverBgColor: entry.journeyInputSelectHoverColor,
    buttonFocusRingColor: entry.buttonFocusBorderColor,
    inputTextColor: entry.journeyInputTextColor,
    cardTextColor: entry.journeyCardTextColor,
    bodyTextColor: entry.bodyText,
    buttonTextColor: entry.textColor,
  };
  return themeSchema.safeParse(raw).data ?? undefined;
}

export async function fetchIdmTheme(
  idmBaseUrl: string,
  realmPath: string,
  journeyName: string | null,
): Promise<IdmThemeResult> {
  const url = new URL('/openidm/config/ui/themerealm', idmBaseUrl).href;
  const cacheKey = `${realmPath}::${journeyName ?? ''}`;
  const cached = cacheGet(cacheKey);
  const emptyResult: IdmThemeResult = {
    theme: undefined,
    themeCatalog: {},
    backgroundImageUrl: undefined,
  };
  let response: Response;

  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(resolveTimeoutMs()),
    });
  } catch {
    console.warn(`[theming] IDM fetch failed: ${url}`);
    return cached ?? emptyResult;
  }

  if (!response.ok) {
    console.warn(`[theming] IDM returned ${response.status} for ${url}`);
    return cached ?? emptyResult;
  }

  let body: IdmThemeRealmResponse;
  try {
    body = (await response.json()) as IdmThemeRealmResponse;
  } catch {
    console.warn('[theming] IDM response was not valid JSON');
    return cached ?? emptyResult;
  }

  const themes = body.realm?.[realmPath] ?? [];

  const themeCatalog = themes.reduce<Record<string, ThemeObject>>((catalog, entry) => {
    if (!entry._id) return catalog;
    const mapped = toIdmTheme(entry);
    return mapped ? { ...catalog, [entry._id]: mapped } : catalog;
  }, {});

  const matched =
    (journeyName && themes.find((theme) => theme.linkedTrees?.includes(journeyName))) ??
    themes.find((theme) => theme.isDefault) ??
    themes[0];

  if (!matched) return cached ?? { ...emptyResult, themeCatalog };

  const backgroundImageUrl =
    matched.backgroundImage && urlRegex.test(matched.backgroundImage)
      ? matched.backgroundImage
      : undefined;

  const result: IdmThemeResult = {
    theme: toIdmTheme(matched),
    themeCatalog,
    backgroundImageUrl,
  };

  cacheSet(cacheKey, result);
  return result;
}
