/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';

const JOURNEY_PATH = '/?journey=TEST_ThemeE2E';

// TEST_ThemeE2E's theme: primaryColor #FD0000 -> hsl(0, 100%, 49.6%)
const EXPECTED_THEME_VARS = {
  '--tw-colors-primary-dark-hs': '0, 100%',
  '--tw-colors-primary-dark-l': '49.6%',
  '--fr-page-bg-image':
    'url("https://qa65.lplbusinesssolutions.com/content/dam/lpl-www/lplbusinesssolutions/images/GettyImages-996615754.jpg")',
};

/**
 * Runs against a dedicated preview server (the `idm-theme` Playwright project) with
 * FR_IDM_URL pointed at the real test tenant's IDM instance and FR_AM_JOURNEY_LOGIN set to
 * TEST_ThemeE2E — a tree dedicated to this test, linked to its own dedicated TEST_ThemeE2E
 * theme, so the assertions below aren't coupled to whatever theme the production Login journey
 * has at any given time. fetchIdmTheme runs server-side in +layout.server.ts, so it can't be
 * intercepted with page.route — these prove the real injection path: the tenant's
 * themerealm response -> ThemeObject -> (app)/+layout.svelte's `themeStyle` inline style
 * on `.theme-root`.
 */
test('IDM theme is injected into .theme-root as inline CSS vars in the SSR HTML', async ({
  page,
  request,
}) => {
  const response = await request.get(JOURNEY_PATH);
  expect(response.ok()).toBe(true);

  // DOMParser decodes the HTML entities SSR applies to the attribute (`&quot;`) without
  // running scripts or hydrating, so this is the exact server-rendered `style` value.
  const ssrStyle = await page.evaluate(
    (html) =>
      new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector('.theme-root')
        ?.getAttribute('style'),
    await response.text(),
  );

  Object.entries(EXPECTED_THEME_VARS).forEach(([name, value]) => {
    expect(ssrStyle).toContain(`${name}:${value}`);
  });
});

test('IDM theme vars are still applied to .theme-root after hydration', async ({ page }) => {
  await page.goto(JOURNEY_PATH);

  // Read through the CSSOM rather than the attribute string, so the check does not depend on
  // how the browser serializes `name:value` spacing after hydration.
  const themeRoot = page.locator('.theme-root');
  await Promise.all(
    Object.entries(EXPECTED_THEME_VARS).map(([name, value]) =>
      expect
        .poll(() =>
          themeRoot.evaluate((element, property) => element.style.getPropertyValue(property), name),
        )
        .toBe(value),
    ),
  );
});
