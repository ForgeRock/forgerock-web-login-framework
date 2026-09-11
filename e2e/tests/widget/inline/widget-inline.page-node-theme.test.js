/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';

import { asyncEvents } from '../../utilities/async-events.js';

const LOGO_URL = 'https://example.com/theme-red-logo.png';

const THEME_CATALOG = {
  'theme-red': { primaryColor: '#cc0000', logo: LOGO_URL, logoHeight: 48 },
  'theme-blue': { primaryColor: '#0000cc' },
};

function routeAuthenticate(page) {
  let count = 0;
  return page.route('**/authenticate**', async (route) => {
    count += 1;
    if (count === 1) {
      await route.fulfill({
        status: 200,
        json: {
          authId: 'mock-page-theme-auth-id',
          stage: 'themeId=theme-red',
          callbacks: [
            {
              type: 'NameCallback',
              output: [{ name: 'prompt', value: 'User Name' }],
              input: [{ name: 'IDToken1', value: '' }],
              _id: 0,
            },
          ],
        },
      });
      return;
    }
    if (count === 2) {
      await route.fulfill({
        status: 200,
        json: {
          authId: 'mock-page-theme-auth-id-2',
          stage: JSON.stringify({ themeId: 'theme-blue' }),
          callbacks: [
            {
              type: 'PasswordCallback',
              output: [{ name: 'prompt', value: 'Password' }],
              input: [{ name: 'IDToken1', value: '' }],
              _id: 0,
            },
          ],
        },
      });
      return;
    }
    await route.fulfill({
      status: 200,
      json: {
        authId: 'mock-page-theme-auth-id-3',
        stage: 'UnthemedStage',
        callbacks: [
          {
            type: 'NameCallback',
            output: [{ name: 'prompt', value: 'Confirm username' }],
            input: [{ name: 'IDToken1', value: '' }],
            _id: 0,
          },
        ],
      },
    });
  });
}

test('Page Node theme override applies per step, without a full page reload', async ({ page }) => {
  const { clickButton } = asyncEvents(page);
  await routeAuthenticate(page);

  const themeCatalogParam = encodeURIComponent(JSON.stringify(THEME_CATALOG));
  const navigations = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) navigations.push(frame.url());
  });

  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/authenticate')),
    page.goto(`widget/inline/theme?themeCatalog=${themeCatalogParam}`),
  ]);
  await page.waitForSelector('.fr_widget-root', { state: 'attached' });
  navigations.length = 0;

  await test.step('first step resolves themeId=theme-red from key=value stage, including logo vars', async () => {
    await page.getByLabel('Username').waitFor();

    const primaryDarkHs = await page.evaluate(() => {
      const root = document.querySelector('.fr_widget-root');
      return root?.style.getPropertyValue('--tw-colors-primary-dark-hs') ?? '';
    });
    const primaryDarkL = await page.evaluate(() => {
      const root = document.querySelector('.fr_widget-root');
      return root?.style.getPropertyValue('--tw-colors-primary-dark-l') ?? '';
    });
    // #cc0000 = hsl(0, 100%, 40%)
    expect(primaryDarkHs).toBe('0, 100%');
    expect(primaryDarkL).toBe('40%');

    const logoLight = await page.evaluate(() => {
      const root = document.querySelector('.fr_widget-root');
      return root?.style.getPropertyValue('--logo-light') ?? '';
    });
    const logoHeight = await page.evaluate(() => {
      const root = document.querySelector('.fr_widget-root');
      return root?.style.getPropertyValue('--fr-logo-height') ?? '';
    });
    expect(logoLight).toContain(LOGO_URL);
    expect(logoHeight).toBe('48px');

    // Precedence: the page-node theme's primary --logo-* slot wins over the
    // static configure() fallback; the fallback var must remain on the root
    // untouched, feeding the CSS fallback chain.
    const fallbackLight = await page.evaluate(() => {
      const root = document.querySelector('.fr_widget-root');
      return root?.style.getPropertyValue('--fr-logo-light-fallback') ?? '';
    });
    expect(fallbackLight).toContain('fallback-logo.png');

    const computedLogo = await page
      .locator('.tw_dialog-logo')
      .first()
      .evaluate((el) => window.getComputedStyle(el).height);
    expect(computedLogo).toBe('48px');
  });

  await test.step('second step resolves themeId=theme-blue from JSON stage and clears the first theme’s logo vars', async () => {
    await page.getByLabel('Username').fill('demouser');
    await clickButton('Next', '/authenticate');
    await page.getByLabel('Password', { exact: true }).fill('j56eKtae*1');

    const primaryDarkHs = await page.evaluate(() => {
      const root = document.querySelector('.fr_widget-root');
      return root?.style.getPropertyValue('--tw-colors-primary-dark-hs') ?? '';
    });
    // #0000cc = hsl(240, 100%, 40%)
    expect(primaryDarkHs).toBe('240, 100%');

    const logoHeight = await page.evaluate(() => {
      const root = document.querySelector('.fr_widget-root');
      return root?.style.getPropertyValue('--fr-logo-height') ?? '';
    });
    expect(logoHeight).toBe('');

    // The static config fallbacks survive the full-replace because the logo
    // effect re-applies them after the theme effect in the same cycle.
    const fallbackLight = await page.evaluate(() => {
      const root = document.querySelector('.fr_widget-root');
      return root?.style.getPropertyValue('--fr-logo-light-fallback') ?? '';
    });
    expect(fallbackLight).toContain('fallback-logo.png');
  });

  await test.step('third step has no themeId — falls through and clears the previous page theme entirely', async () => {
    await clickButton('Next', '/authenticate');
    await page.getByLabel('Confirm username', { exact: true }).waitFor();

    const primaryDarkHs = await page.evaluate(() => {
      const root = document.querySelector('.fr_widget-root');
      return root?.style.getPropertyValue('--tw-colors-primary-dark-hs') ?? '';
    });
    expect(primaryDarkHs).toBe('');

    // Clearing the inline override isn't enough on its own — assert the button
    // actually renders the app's default theme color (slate-700), proving the
    // CSS custom property's :root fallback takes over rather than the button
    // rendering unstyled.
    await expect(page.getByRole('button', { name: 'Next' })).toHaveCSS(
      'background-color',
      'rgb(51, 65, 85)',
    );

    // With no theme, the static config fallback chain is what renders the logo.
    const computedBackgroundImage = await page
      .locator('.tw_dialog-logo')
      .first()
      .evaluate((el) => window.getComputedStyle(el).backgroundImage);
    expect(computedBackgroundImage).toContain('fallback-logo.png');
  });

  await test.step('no full page navigation occurred across the theme switches', () => {
    expect(navigations).toEqual([]);
  });
});

test('Static configure({ style: { logo } }) alone drives the logo through fallback vars', async ({
  page,
}) => {
  // Mock the authenticate round-trip like the sibling tests so this spec never
  // depends on live TEST_Login tenant state.
  await routeAuthenticate(page);

  await page.goto('widget/inline/theme');
  await page.waitForSelector('.fr_widget-root', { state: 'attached' });
  await page.getByLabel('Username').waitFor();

  await test.step('root carries only the fallback logo vars, no theme vars', async () => {
    const rootVars = await page.evaluate(() => {
      const root = document.querySelector('.fr_widget-root');
      return {
        lightFallback: root?.style.getPropertyValue('--fr-logo-light-fallback') ?? '',
        darkFallback: root?.style.getPropertyValue('--fr-logo-dark-fallback') ?? '',
        logoLight: root?.style.getPropertyValue('--logo-light') ?? '',
        logoDark: root?.style.getPropertyValue('--logo-dark') ?? '',
        logoHeight: root?.style.getPropertyValue('--fr-logo-height') ?? '',
        logoWidth: root?.style.getPropertyValue('--fr-logo-width') ?? '',
      };
    });
    expect(rootVars.lightFallback).toBe('url("https://example.com/fallback-logo.png")');
    expect(rootVars.darkFallback).toBe('url("https://example.com/fallback-logo.png")');
    expect(rootVars.logoLight).toBe('');
    expect(rootVars.logoDark).toBe('');
    expect(rootVars.logoHeight).toBe('');
    expect(rootVars.logoWidth).toBe('');
  });

  await test.step('logo element renders via the fallback chain at the 4.5rem default', async () => {
    const logo = page.locator('.tw_dialog-logo').first();
    await expect(logo).toHaveCSS('height', '72px');
    const backgroundImage = await logo.evaluate(
      (el) => window.getComputedStyle(el).backgroundImage,
    );
    expect(backgroundImage).toContain('fallback-logo.png');
  });
});
