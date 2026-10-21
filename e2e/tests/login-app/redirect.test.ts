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

/**
 * Tenant journey fixture used here (configured in the test tenant's alpha
 * realm; see playwright.config.ts for connection details):
 *
 * - TEST_FailureUrlNode — login page -> Data Store Decision -> on failed
 *   authentication, SetFailureUrlNode (see
 *   https://docs.pingidentity.com/auth-node-ref/latest/failure-url.html) ->
 *   journey failure. AM resolves the node URL into the LoginFailure payload's
 *   `detail.failureUrl`. With no param, that URL is the destination; with a
 *   valid param, the param's URL wins (Platform Login's redirectToFailure
 *   order). A wrong password is what drives the failure — the same shape as
 *   the default Login tree, plus the node.
 *
 * The other tests use the realm's default `Login` tree: a wrong password
 * fails there, and AM resolves a valid `gotoOnFail` param into
 * `detail.failureUrl` on that failed attempt.
 *
 * "Valid"/"invalid" gotoOnFail means listed in AM's Validation Service
 * ("Valid goto URL Resources") or not. A valid param resolves into the
 * failure payload and redirects; an invalid one is dropped and the failure
 * stays retryable.
 *
 * Failure-URL precedence docs:
 * https://docs.pingidentity.com/pingoneaic/am-authentication/redirection-url-precedence.html
 */

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

test('Invalid credentials with a valid gotoOnFail redirect to the gotoOnFail URL', async ({
  page,
}) => {
  // The core gotoOnFail contract: the login FAILS (wrong password), AM
  // resolves the valid (Validation Service-listed) param into
  // detail.failureUrl, the journey completes as failed, and the app
  // redirects to the param URL.
  await page.goto('/?gotoOnFail=' + encodeURIComponent('https://www.pingidentity.com/en.html'));

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill('WrongPassword123!');
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page).toHaveURL('https://www.pingidentity.com/en.html');
});

test('Invalid credentials restart the login journey without following gotoOnFail', async ({
  page,
}) => {
  // This URL is never navigated to; it only has to be invalid (not in AM's
  // validation service) so the wrong-password failure stays retryable (no
  // `detail.failureUrl`) and journey-client restarts the journey on the page.
  await page.goto('/?gotoOnFail=' + encodeURIComponent('https://www.forgerock.com/'));

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill('WrongPassword123!');
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByText('Sign in failed')).toBeVisible();

  await expect(page).toHaveURL(/\/\?gotoOnFail=/);
  await expect(page.getByLabel('Username')).toBeEditable();
});

test('journey Failure URL node redirects a terminal failure without a gotoOnFail param', async ({
  page,
}) => {
  // The wrong password takes the decision node's false outcome through the
  // SetFailureUrlNode, whose URL AM resolves into detail.failureUrl. With no
  // gotoOnFail param, the completed-failure journey forwards that URL through
  // the redirect form, and resolveRedirect's journeyStepRedirect resolver
  // sends the user there.
  await page.goto('/?journey=TEST_FailureUrlNode');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill('WrongPassword123!');
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page).toHaveURL('https://forgerock.github.io/openam-community-edition/');
});

test('gotoOnFail param redirects a terminal failure even when the tree has a Failure URL node', async ({
  page,
}) => {
  // Matching Platform Login: a valid gotoOnFail param wins over AM's
  // resolved payload failureUrl (the wrong password routes through the
  // journey's SetFailureUrlNode, so detail.failureUrl holds the node URL).
  // The param's URL is the destination.
  await page.goto(
    '/?journey=TEST_FailureUrlNode&gotoOnFail=' +
      encodeURIComponent('https://www.pingidentity.com/en.html'),
  );

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill('WrongPassword123!');
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page).toHaveURL('https://www.pingidentity.com/en.html');
});

test('Invalid gotoOnFail param loses to a journey Failure URL node', async ({ page }) => {
  // AM ignores the invalid param and keeps the node URL in the payload's
  // detail.failureUrl. The app still validates the param first, but an
  // invalid param resolves to AM's default success URL (/enduser/) — not a
  // real destination — so the payload's node URL wins. (Deliberate
  // improvement over Platform Login, whose console-only isDefaultPath check
  // swallows its own equivalent fallback and sends the user to /enduser/).
  await page.goto(
    '/?journey=TEST_FailureUrlNode&gotoOnFail=' + encodeURIComponent('https://www.forgerock.com/'),
  );

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill('WrongPassword123!');
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page).toHaveURL('https://forgerock.github.io/openam-community-edition/');
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
