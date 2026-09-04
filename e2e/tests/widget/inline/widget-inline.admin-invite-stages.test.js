/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';

const WELCOME_STEP = {
  authId: 'mock-admin-invite-auth-id',
  callbacks: [
    {
      type: 'TextOutputCallback',
      output: [
        { name: 'message', value: '<span class="p1aic-tenant-name">my-tenant</span>' },
        { name: 'messageType', value: '4' },
      ],
    },
  ],
};

const INVALID_STEP = {
  authId: 'mock-admin-invite-auth-id-2',
  callbacks: [
    {
      type: 'TextOutputCallback',
      output: [
        { name: 'message', value: 'Invitation not valid' },
        { name: 'messageType', value: '4' },
      ],
    },
  ],
};

function routeAuthenticate(page, step) {
  return page.route('**/authenticate**', async (route) => {
    await route.fulfill({ status: 200, json: step });
  });
}

test('AdminInviteWelcome renders logo from root-level fallback vars without inline styles', async ({
  page,
}) => {
  await routeAuthenticate(page, WELCOME_STEP);

  await page.goto(
    'widget/stages?logoLight=https%3A%2F%2Fexample.com%2Fstage-logo.png&logoHeight=56',
  );

  await page.getByRole('button', { name: 'Send Verification Code' }).waitFor();
  // The button label must come from the locale catalog, not the key-derived
  // fallback text both would render without an initialized stringsStore.
  await expect(
    page.getByRole('button', { name: 'Send Verification Code', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Welcome to PingOne Advanced Identity Cloud' }),
  ).toBeVisible();
  // Interpolated description includes the tenant name parsed from the callback.
  await expect(
    page.getByText("You've been invited to administer the my-tenant tenant"),
  ).toBeVisible();

  const rootVars = await page.evaluate(() => {
    const root = document.querySelector('.fr_widget-root');
    return {
      lightFallback: root?.style.getPropertyValue('--fr-logo-light-fallback') ?? '',
      darkFallback: root?.style.getPropertyValue('--fr-logo-dark-fallback') ?? '',
      height: root?.style.getPropertyValue('--fr-logo-height') ?? '',
      width: root?.style.getPropertyValue('--fr-logo-width') ?? '',
      primaryLight: root?.style.getPropertyValue('--logo-light') ?? '',
    };
  });
  expect(rootVars.lightFallback).toBe('url("https://example.com/stage-logo.png")');
  expect(rootVars.darkFallback).toBe('url("")');
  expect(rootVars.height).toBe('56px');
  expect(rootVars.width).toBe('');
  // No IDM/page-node theme is in play, so the primary slots stay unset.
  expect(rootVars.primaryLight).toBe('');

  // The logo div itself carries no inline style — vars come from the root.
  const logoEl = page.locator('.tw_dialog-logo').first();
  const inlineStyle = await logoEl.getAttribute('style');
  expect(inlineStyleHasLogoVars(inlineStyle)).toBe(false);

  const backgroundImage = await logoEl.evaluate(
    (el) => window.getComputedStyle(el).backgroundImage,
  );
  expect(backgroundImage).toContain('stage-logo.png');
  const height = await logoEl.evaluate((el) => window.getComputedStyle(el).height);
  expect(height).toBe('56px');
  // No width is configured, so the stage context keeps the pre-var 200px
  // inline default instead of the dialog's 100%.
  const width = await logoEl.evaluate((el) => window.getComputedStyle(el).width);
  expect(width).toBe('200px');
});

test('AdminInviteInvalid renders with the same root-level fallback chain', async ({ page }) => {
  await routeAuthenticate(page, INVALID_STEP);

  await page.goto(
    'widget/stages?logoLight=https%3A%2F%2Fexample.com%2Fstage-logo.png&logoHeight=56',
  );

  await page.getByRole('heading', { name: 'Invitation not valid' }).waitFor();
  // Real locale strings, not key-derived fallback text: the description renders
  // through the sanitized html path, keeping its target/rel attributes.
  const descriptionLink = page.getByRole('link', { name: 'Ping Support' });
  await expect(descriptionLink).toBeVisible();
  await expect(descriptionLink).toHaveAttribute('target', '_blank');

  const rootVars = await page.evaluate(() => {
    const root = document.querySelector('.fr_widget-root');
    return {
      lightFallback: root?.style.getPropertyValue('--fr-logo-light-fallback') ?? '',
      height: root?.style.getPropertyValue('--fr-logo-height') ?? '',
    };
  });
  expect(rootVars.lightFallback).toBe('url("https://example.com/stage-logo.png")');
  expect(rootVars.height).toBe('56px');

  const backgroundImage = await page
    .locator('.tw_dialog-logo')
    .first()
    .evaluate((el) => window.getComputedStyle(el).backgroundImage);
  expect(backgroundImage).toContain('stage-logo.png');
});

test('Configured logoWidth drives --fr-logo-width and the rendered stage logo width', async ({
  page,
}) => {
  await routeAuthenticate(page, WELCOME_STEP);

  await page.goto(
    'widget/stages?logoLight=https%3A%2F%2Fexample.com%2Fstage-logo.png&logoWidth=200',
  );

  await page.getByRole('button', { name: 'Send Verification Code' }).waitFor();

  const rootVars = await page.evaluate(() => {
    const root = document.querySelector('.fr_widget-root');
    return {
      width: root?.style.getPropertyValue('--fr-logo-width') ?? '',
      height: root?.style.getPropertyValue('--fr-logo-height') ?? '',
    };
  });
  expect(rootVars.width).toBe('200px');
  // Height stays unset when not configured, so the 4.5rem class fallback rules.
  expect(rootVars.height).toBe('');

  const logoEl = page.locator('.tw_dialog-logo').first();
  const width = await logoEl.evaluate((el) => window.getComputedStyle(el).width);
  expect(width).toBe('200px');
  const height = await logoEl.evaluate((el) => window.getComputedStyle(el).height);
  expect(height).toBe('72px');
});

test('Dark-mode logo renders the dark fallback URL on the stage logo', async ({ page }) => {
  await routeAuthenticate(page, WELCOME_STEP);

  await page.goto(
    'widget/stages?logoDark=https%3A%2F%2Fexample.com%2Fstage-logo-dark.png&logoLight=https%3A%2F%2Fexample.com%2Fstage-logo.png',
  );

  await page.getByRole('button', { name: 'Send Verification Code' }).waitFor();

  const backgroundImage = await page.evaluate(() => {
    // The login-app compiles Tailwind dark variants against a `tw_dark` class
    // on <body> (added by app.html under prefers-color-scheme: dark), not a
    // `dark` class on <html>.
    document.body.classList.add('tw_dark');
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const logoEl = document.querySelector('.tw_dialog-logo');
        resolve(logoEl ? window.getComputedStyle(logoEl).backgroundImage : '');
      });
    });
  });
  expect(backgroundImage).toContain('stage-logo-dark.png');
});

function inlineStyleHasLogoVars(style) {
  if (!style) {
    return false;
  }
  return /--logo-|--fr-logo-/.test(style);
}
