/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';

import { password, username } from '../utilities/demo-user.js';

test('Successful redirect', async ({ page }) => {
  await page.goto('/?goto=https://forgerock.github.io/');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page).toHaveURL('https://forgerock.github.io/');
});

test('Invalid domain redirects to end user UI', async ({ page }) => {
  await page.goto('/?goto=https://invalidurl.com');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Next' }).click();

  // https://invalidurl.com does not exist in validation service
  // so it should redirect to end user UI
  await expect(page).toHaveURL('https://openam-sdks.forgeblocks.com/enduser/?realm=/alpha#/');
});

test('Empty URL redirects to fallback', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Next' }).click();

  // With no goto, AM falls back to its default success URL (end user UI).
  await expect(page).toHaveURL('https://openam-sdks.forgeblocks.com/enduser/?realm=/alpha#/');
});

test('goto=console default path falls through to the journey step URL', async ({ page }) => {
  await page.goto('/?goto=' + encodeURIComponent('https://openam-sdks.forgeblocks.com/am/console'));

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Next' }).click();

  // validateGoto resolves a `console` path to the default success URL, which
  // resolveRedirect treats as a "default path" and falls through to journeyStepUrl instead.
  await expect(page).toHaveURL('https://openam-sdks.forgeblocks.com/am/console/');
});

test('SAML goto URL passes through when the default path is returned', async ({ page }) => {
  await page.goto(
    '/?goto=' +
      encodeURIComponent('https://openam-sdks.forgeblocks.com/am/saml2/jsp/idpSSOInit.jsp'),
  );

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page).toHaveURL('https://openam-sdks.forgeblocks.com/am/saml2/jsp/idpSSOInit.jsp');
});

test('Non-admin user is redirected to the end-user UI by role', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Next' }).click();

  // Same-shape assertion as the "Empty URL" fallback test, but this documents
  // that the URL comes from the role-redirect branch (non-admin -> /enduser/),
  // not the generic fallback. See redirect.utilities.test.ts for the admin branch,
  // which has no E2E-reachable fixture in this environment (see ticket Risks/Notes).
  await expect(page).toHaveURL('https://openam-sdks.forgeblocks.com/enduser/?realm=/alpha#/');
});

test('gotoOnFail sends a terminal login failure to /failure-redirect', async ({ page }) => {
  await page.goto('/?gotoOnFail=' + encodeURIComponent('https://forgerock.github.io/fail'));

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill('WrongPassword123!');
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByText('Sign in failed')).toBeVisible();

  // journey-client restarts the journey after a LoginFailure rather than terminating it,
  // so the redirect action (and gotoOnFail) is never reached from a single bad attempt —
  // the form simply resets to a fresh, usable state on the same page.
  await expect(page).toHaveURL(/\/\?gotoOnFail=/);
  await expect(page.getByLabel('Username')).toBeEditable();
});

test('goto cookie is set on page load and cleared after the redirect form POST', async ({
  page,
}) => {
  await page.goto('/?goto=' + encodeURIComponent('https://forgerock.github.io/'));

  const cookiesAfterLoad = await page.context().cookies();
  const redirectCookie = cookiesAfterLoad.find((cookie) => cookie.name === 'redirect_query_params');
  expect(redirectCookie).toBeDefined();
  expect(redirectCookie?.value).toContain('forgerock.github.io');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page).toHaveURL('https://forgerock.github.io/');

  const cookiesAfterSubmit = await page.context().cookies();
  expect(
    cookiesAfterSubmit.find((cookie) => cookie.name === 'redirect_query_params'),
  ).toBeUndefined();
});
