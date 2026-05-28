/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';

test('Theme override applies CSS vars to inline widget root', async ({ page }) => {
  await page.goto(
    'widget/inline/theme?primaryColor=%23cc0000&buttonBorderRadius=20&cardBorderRadius=16',
  );
  await page.waitForSelector('.fr_widget-root', { state: 'attached' });

  await test.step('primary color converts to HSL channel pair', async () => {
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
  });

  await test.step('buttonBorderRadius sets --fr-button-border-radius', async () => {
    const buttonRadius = await page.evaluate(() => {
      const root = document.querySelector('.fr_widget-root');
      return root?.style.getPropertyValue('--fr-button-border-radius') ?? '';
    });
    expect(buttonRadius).toBe('20px');
  });

  await test.step('cardBorderRadius sets --fr-card-border-radius', async () => {
    const cardRadius = await page.evaluate(() => {
      const root = document.querySelector('.fr_widget-root');
      return root?.style.getPropertyValue('--fr-card-border-radius') ?? '';
    });
    expect(cardRadius).toBe('16px');
  });
});

test('Default inline widget has no inline theme CSS vars', async ({ page }) => {
  await page.goto('widget/inline/theme');
  await page.waitForSelector('.fr_widget-root', { state: 'attached' });

  await test.step('no --tw-colors-primary-dark-hs on root', async () => {
    const primaryDarkHs = await page.evaluate(() => {
      const root = document.querySelector('.fr_widget-root');
      return root?.style.getPropertyValue('--tw-colors-primary-dark-hs') ?? '';
    });
    expect(primaryDarkHs).toBe('');
  });
});

test('Partial theme sets only the provided CSS vars on inline widget', async ({ page }) => {
  await page.goto('widget/inline/theme?primaryColor=%23ff6600');
  await page.waitForSelector('.fr_widget-root', { state: 'attached' });

  await test.step('provided color is applied', async () => {
    const primaryHs = await page.evaluate(() => {
      const root = document.querySelector('.fr_widget-root');
      return root?.style.getPropertyValue('--tw-colors-primary-dark-hs') ?? '';
    });
    // #ff6600 = hsl(24, 100%, 50%)
    expect(primaryHs).toBe('24, 100%');
  });

  await test.step('unset vars are absent', async () => {
    const buttonRadius = await page.evaluate(() => {
      const root = document.querySelector('.fr_widget-root');
      return root?.style.getPropertyValue('--fr-button-border-radius') ?? '';
    });
    expect(buttonRadius).toBe('');
  });
});

test('Invalid hex color is ignored on inline widget', async ({ page }) => {
  await page.goto('widget/inline/theme?primaryColor=notacolor');
  await page.waitForSelector('.fr_widget-root', { state: 'attached' });

  await test.step('invalid color produces no CSS var', async () => {
    const primaryHs = await page.evaluate(() => {
      const root = document.querySelector('.fr_widget-root');
      return root?.style.getPropertyValue('--tw-colors-primary-dark-hs') ?? '';
    });
    expect(primaryHs).toBe('');
  });
});
