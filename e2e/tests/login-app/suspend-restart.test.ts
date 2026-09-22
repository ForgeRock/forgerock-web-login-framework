/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';

import type { Page } from '@playwright/test';

/**
 * IAM-12006: restart after a failed suspended-journey resume must target the right
 * journey. The URL may carry the journey (?journey=), an earlier page load may have
 * remembered it (localStorage), or a fresh device falls back to the host-configured
 * default (FR_AM_JOURNEY_LOGIN) — never start(undefined).
 *
 * The fake suspendedId makes AM respond LoginFailure immediately, so no real suspend
 * duration is needed. The candidate journeys render identically, so each test decodes
 * authIndexValue out of the restarted call's authId JWT (the tree AM actually resolved).
 */

async function captureAuthIndexValues(page: Page) {
  const authIndexValues: string[] = [];
  await page.route(
    (url) => url.pathname.endsWith('/authenticate'),
    async (route) => {
      const response = await route.fetch();
      const authId = (await response.json())?.authId as string | undefined;
      if (authId) {
        const payloadSegment = authId.split('.')[1];
        const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(
          atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')),
        );
        authIndexValues.push(payload.authIndexValue ?? '(no authIndexValue)');
      }
      await route.fulfill({ response });
    },
  );
  return authIndexValues;
}

test('expired suspendedId restart lands on the suspended journey, not the realm default', async ({
  page,
}) => {
  const journey = 'TEST_LoginSuspendEmail';
  const authIndexValues = await captureAuthIndexValues(page);

  await page.goto(`/?journey=${journey}&suspendedId=e2e-expired-suspended-id`);

  await expect.poll(() => authIndexValues).toContain(journey);
  await expect(page.getByLabel('Username')).toBeVisible();
});

test('bare suspendedId restart uses the journey remembered from an earlier start', async ({
  page,
}) => {
  const journey = 'TEST_LoginSuspendEmail';
  const authIndexValues = await captureAuthIndexValues(page);

  await page.goto(`/?journey=${journey}`);
  await expect(page.getByLabel('Username')).toBeVisible();

  // Drop load-1 captures so the poll only sees load-2 calls.
  authIndexValues.length = 0;

  await page.goto(`/?suspendedId=e2e-bare-suspended-id`);

  await expect.poll(() => authIndexValues, { timeout: 45_000 }).toContain(journey);
  await expect(page.getByLabel('Username')).toBeVisible();
});
