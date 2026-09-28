/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';

/**
 * Custom header/footer selection is build-time: the registry generation
 * (customRegistry Vite plugin) bundles exactly the header/footer components
 * whose @component block declares "Enabled: true" — at most one of each type
 * (a second enabled component of the same type fails the build). Dormant
 * components (no Enabled line, or Enabled: false) are skipped entirely.
 *
 * The git-tracked demo-header/demo-footer components (experimental/custom/
 * headers/demo-header/ and footers/demo-footer/, negated back into tracking
 * in .gitignore) are the Enabled: true reference components this test asserts
 * against, so it passes on a fresh CI checkout.
 *
 * This is the happy path the retired custom-component-error test could not
 * cover (that server was dedicated to the env-var unknown-name throw path,
 * which no longer exists).
 */
test('Enabled demo custom header and footer render around the journey', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);

  // DemoHeader markup: the <header> element itself (journey-stage headers are
  // not yet rendered at page load, so this is unambiguous at this point).
  const header = page.locator('header.tw_flex.tw_items-center');
  await expect(header).toBeVisible();
  // Product name via interpolate() fallback — scoped to the header so the
  // footer's identical copyright string cannot collide under strict mode.
  await expect(header.getByText('Acme Identity')).toBeVisible();

  // DemoFooter markup: the <footer> element with the terms link.
  const footer = page.locator('footer');
  await expect(footer.getByRole('link', { name: 'Terms of use' })).toBeVisible();

  // Ordering: header above the journey card container, footer below it. The
  // journey card is the .tw_containing-box div inside the Box primitive, NOT
  // the .tw_h-full wrapper (which is the header's own ancestor and would make
  // a y-comparison against it vacuous).
  const headerBox = await header.boundingBox();
  const journeyBox = await page.locator('.tw_containing-box').first().boundingBox();
  const footerBox = await footer.boundingBox();
  expect(headerBox.y + headerBox.height).toBeLessThanOrEqual(journeyBox.y);
  expect(footerBox.y).toBeGreaterThanOrEqual(journeyBox.y + journeyBox.height);
});
