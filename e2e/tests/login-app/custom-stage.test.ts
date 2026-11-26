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
 * SDKS-5511: proves a custom stage from custom/components/stages/ renders in
 * the journey. The canary stage (Name: E2eCanaryStage) is a tracked fixture —
 * the name never occurs in a real AM journey, so the only step that maps to
 * it is the /authenticate response mocked below. This exercises the full
 * pipeline: registry scan → custom-registry.ts generation (consumer build) →
 * mapStepToStage override → journey render with the documented stage props →
 * form.submit() advancing to the next step.
 *
 * The mock follows the page-node-theme precedent: only /authenticate is
 * intercepted (the well-known fetch still hits the real AM tenant; CORS is
 * irrelevant because Playwright routes intercept in the browser before the
 * network). Response 2 carries successUrl with no authId, which journey-client
 * parses as LoginSuccess → journeyStore.successful.
 *
 * This file runs on the shared chromium project (port 3000): the filename must
 * avoid config-error|idm-theme|default-journey|component-api-disabled, and
 * test titles must avoid "webauthn" so the grep-filtered first chromium
 * project never picks them up.
 */

const CANARY_RESPONSE = {
  authId: 'mock-e2e-canary-step',
  stage: 'E2eCanaryStage',
  callbacks: [
    {
      type: 'NameCallback',
      output: [{ name: 'prompt', value: 'Canary User Name' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
  ],
};

const SUCCESS_RESPONSE = {
  successUrl: 'https://openam-sdks.forgeblocks.com/console',
  tokenId: 'mock-e2e-canary-token',
  realm: '/alpha',
};

function routeCanaryJourney(page: Page): void {
  let count = 0;
  void page.route('**/authenticate**', async (route) => {
    count += 1;
    if (count === 1) {
      await route.fulfill({ status: 200, json: CANARY_RESPONSE });
      return;
    }
    await route.fulfill({ status: 200, json: SUCCESS_RESPONSE });
  });
}

test('custom stage from custom/components renders in the journey', async ({ page }) => {
  routeCanaryJourney(page);

  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/authenticate')),
    page.goto('widget/stages'),
  ]);

  // The canary stage replaces the built-in renderer: its marker markup is on
  // the page, and the built-in DefaultLogin header is not.
  const canary = page.getByTestId('e2e-canary');
  await expect(canary).toBeVisible();
  await expect(canary).toHaveAttribute('data-canary-style', 'app');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toHaveCount(0);

  // The stage received the mocked callbacks via the documented contract:
  // step.callbacks mapped through CallbackMapper renders the NameCallback.
  await expect(page.getByLabel('Canary User Name')).toBeVisible();

  // The canary's own submit button label proves the custom markup renders
  // (the built-in stages never render "Canary submit").
  await expect(page.getByRole('button', { name: 'Canary submit' })).toBeVisible();

  // Submitting through form.submit() advances the journey to the mocked
  // success response — the custom stage participates in the real flow.
  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/authenticate')),
    page.getByRole('button', { name: 'Canary submit' }).click(),
  ]);
  await expect(canary).toBeHidden();
});

test('built-in stage still renders for steps without a custom stage match', async ({ page }) => {
  void page.route('**/authenticate**', async (route) => {
    // Plain DefaultLogin stage with no custom registry entry — must fall
    // through mapStepToStage to the built-in Login stage.
    await route.fulfill({
      status: 200,
      json: {
        authId: 'mock-e2e-builtin-step',
        stage: 'DefaultLogin',
        callbacks: CANARY_RESPONSE.callbacks,
      },
    });
  });

  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/authenticate')),
    page.goto('widget/stages'),
  ]);

  // Built-in Login stage renders (username input + its header), and the
  // canary never appears.
  await expect(page.getByLabel('Canary User Name')).toBeVisible();
  await expect(page.getByTestId('e2e-canary')).toHaveCount(0);
});
