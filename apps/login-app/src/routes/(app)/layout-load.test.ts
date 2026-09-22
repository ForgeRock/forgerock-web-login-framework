/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it, vi } from 'vitest';

import type { z } from 'zod';

vi.mock('$journey/config.store', () => ({
  initialize: vi.fn(() => ({})),
}));
vi.mock('$core/links.store', () => ({
  initialize: vi.fn(),
}));

// The module under test imports `../../app.css`, which is fine in Vitest but
// the layout's real load also reads SvelteKit `data`; we drive the pure logic
// by calling `load` directly.
import { styleStore } from '$core/style.store';
import { load } from './+layout';

import type { styleSchema } from '$core/style.store';

describe('(app)/+layout.ts load', () => {
  it('does not copy the base idmTheme height into the logo config', () => {
    // Scenario from the SDKS-5332 review: the IDM journey-matched theme
    // ("Starter Theme") has logoHeight 40, while the Page Node theme resolved
    // per step ("Vatsal Test Theme") has logoHeight 100. The layout's logo
    // config is applied AFTER the page theme's vars by applyLogoVars, so a
    // height here would clobber the page theme's --fr-logo-height on every
    // step — the page theme's height must own that var.
    const data = {
      amUrl: 'https://openam.example.com/am',
      backgroundImageUrl: undefined,
      idmTheme: {
        logo: 'https://cdn.example.com/logo.svg',
        logoHeight: 40,
      },
      themeCatalog: {
        'theme-page-node': { logo: 'https://cdn.example.com/logo.svg', logoHeight: 100 },
      },
      realmPath: 'alpha',
      wellknown: 'https://openam.example.com/am/oauth2/alpha/.well-known/openid-configuration',
    };

    load({ data } as unknown as Parameters<typeof load>[0]);

    let current: z.infer<typeof styleSchema> | undefined;
    styleStore.subscribe((value) => {
      current = value;
    })();
    if (!current) {
      throw new Error('styleStore was not initialized');
    }
    const logo = current.logo;

    // light/dark still flow from the IDM theme so a logo renders before any
    // step resolves; the height must be absent so the theme's own
    // --fr-logo-height (from the page-node theme's logoHeight) is not clobbered.
    expect(logo?.light).toBe('https://cdn.example.com/logo.svg');
    expect(logo?.dark).toBe('https://cdn.example.com/logo.svg');
    expect(logo?.height).toBeUndefined();
  });
});
