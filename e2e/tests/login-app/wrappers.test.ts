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
 * SDKS-5236: the login-app renders two fixed, user-editable wrapper files
 * (experimental/custom/header/header.svelte + footer/footer.svelte) around the
 * journey container in (app)/+page.svelte. The wrappers mount client-side only:
 * the first journey step latches `wrappersVisible`, and they then stay mounted
 * through step nulling, journey switches, and the completion redirect state.
 *
 * Assertions are structural (toBeAttached / toHaveAttribute), not optical
 * (toBeVisible): the shipped seed wrappers render display:none placeholder
 * elements, so their containers have an empty bounding box and "visible" is
 * not the honest contract. journeyName is observed on the framework-owned
 * container attribute `data-journey-name`, which binds the same reactive
 * variable passed as the wrapper prop — user wrapper markup is free to change,
 * so the test must not depend on it.
 *
 * Selector: div.tw_shrink-0 is the wrapper container (exactly two instances on
 * the (app) route, above/below <main>). Bare header/footer selectors collide
 * with stage-internal <header id="genericStepHeader"> elements, and role-based
 * banner/contentinfo selectors break legitimately if a customer replaces the
 * seed files with non-header/footer markup.
 *
 * This file runs on the shared chromium project (port 3000): the filename must
 * avoid config-error|idm-theme|default-journey, and test titles must avoid
 * "webauthn" so the grep-filtered first chromium project never picks them up.
 *
 * The tests never establish an AM session: no test follows a successful
 * login to its external redirect (the completion test stubs the form submit,
 * so the POST that would create the session never fires), and a real AM
 * session would make subsequent navigations to '/' 303-redirect to the
 * external end-user UI (+page.server.ts session pre-flight), corrupting both
 * the SSR payload assertion and the default-journey case.
 */

const WRAPPER_CONTAINER = 'div.tw_shrink-0';

test('server-rendered HTML contains no wrapper markup', async ({ page }) => {
  for (const path of ['/', '/?journey=TEST_LoginSuspendEmail']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    const html = await response?.text();
    expect(html).toBeDefined();
    // Wrapper-specific markers only: the tw_shrink-0 container class and the
    // data-journey-name attribute (both render only after the client-side
    // step latch). The SSR shell does contain a Spinner and the hidden POST
    // form, so never assert generic emptiness.
    expect(html).not.toContain('tw_shrink-0');
    expect(html).not.toContain('data-journey-name');
  }
});

test('wrappers mount with journeyName for a named journey', async ({ page }) => {
  await page.goto('/?journey=TEST_LoginSuspendEmail');

  const containers = page.locator(WRAPPER_CONTAINER);
  await expect(containers).toHaveCount(2);

  // journeyName = the ?journey= param, on both the header and footer container.
  await expect(containers.nth(0)).toHaveAttribute('data-journey-name', 'TEST_LoginSuspendEmail');
  await expect(containers.nth(1)).toHaveAttribute('data-journey-name', 'TEST_LoginSuspendEmail');
  await expect(page.getByLabel('Username')).toBeVisible();
});

test('wrappers mount with journeyName for the default journey', async ({ page }) => {
  await page.goto('/');

  const containers = page.locator(WRAPPER_CONTAINER);
  await expect(containers).toHaveCount(2);

  // Bare '/' starts the journey with journey: '' (the AM default journey).
  // Svelte renders an empty-string attribute as present-but-empty, which
  // distinguishes the default journey (attribute = '') from a broken prop
  // (attribute absent).
  await expect(containers.nth(0)).toHaveAttribute('data-journey-name', '');
  await expect(containers.nth(1)).toHaveAttribute('data-journey-name', '');
  await expect(page.getByLabel('Username')).toBeVisible();
});

test('wrappers persist across journey switches between page loads', async ({ page }) => {
  await page.goto('/?journey=TEST_LoginSuspendEmail');
  const containers = page.locator(WRAPPER_CONTAINER);
  await expect(containers.nth(0)).toHaveAttribute('data-journey-name', 'TEST_LoginSuspendEmail');

  // A full reload with a different journey: the wrapper gate re-latches in the
  // new page instance and journeyName tracks the new journey.
  await page.goto('/?journey=TEST_ThemeE2E');
  await expect(containers).toHaveCount(2);
  await expect(containers.nth(0)).toHaveAttribute('data-journey-name', 'TEST_ThemeE2E');
  await expect(containers.nth(1)).toHaveAttribute('data-journey-name', 'TEST_ThemeE2E');
});

test('wrappers persist through an in-page failed-login restart', async ({ page }) => {
  await page.goto('/');
  const containers = page.locator(WRAPPER_CONTAINER);
  await expect(containers.nth(0)).toHaveAttribute('data-journey-name', '');

  // Bad credentials: journey-client restarts the journey in the same page
  // instance (step failure auto-restart), exactly the continuation proven in
  // redirect.test.ts. Wrappers must stay mounted with their attribute.
  await page.getByLabel('Username').fill('wrong-user@example.com');
  await page.getByLabel('Password').fill('WrongPassword123!');
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByText('Sign in failed')).toBeVisible();
  await expect(containers).toHaveCount(2);
  await expect(containers.nth(0)).toHaveAttribute('data-journey-name', '');
  await expect(containers.nth(1)).toHaveAttribute('data-journey-name', '');
});

test('wrappers persist through the completion redirect state', async ({ page }) => {
  // The completion flow renders the transient "You are being redirected..."
  // state and then navigates away via redirectForm.submit() (a real form
  // navigation). Neither route interception flavor can keep the old document
  // assertable: fulfilling the POST commits a new document, and aborting it
  // leaves Chromium on a blank replacement document. So neutralize the
  // navigation itself in the page: HTMLFormElement.prototype.submit is
  // stubbed before app code runs, making redirectForm.submit() a no-op. The
  // page then stays in the redirect state (Journey unmounted, wrappers still
  // mounted) and the form-POST mechanics stay covered by redirect.test.ts.
  await page.addInitScript(() => {
    HTMLFormElement.prototype.submit = () => {};
  });

  await page.goto('/');
  const containers = page.locator(WRAPPER_CONTAINER);
  await expect(containers.nth(0)).toHaveAttribute('data-journey-name', '');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Next' }).click();

  // AM roundtrips make the full login take well over Playwright's default
  // 5s assertion window (the suspend-restart tests use 45s for the same
  // reason), so raise it for the completion sequence.
  await expect(page.getByText('You are being redirected')).toBeVisible({ timeout: 45_000 });
  await expect(containers).toHaveCount(2);
  await expect(containers.nth(0)).toHaveAttribute('data-journey-name', '');
  await expect(containers.nth(1)).toHaveAttribute('data-journey-name', '');
});
