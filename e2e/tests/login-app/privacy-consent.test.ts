/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';

import { AM_REALM } from '../../playwright.config';

import type { Page } from '@playwright/test';

const privacyStep = {
  authId: 'privacy-consent-fixture',
  stage: 'AdminInvitePrivacyPolicy',
  callbacks: [
    {
      type: 'HiddenValueCallback',
      output: [
        { name: 'id', value: 'jurisdiction-input-fixture' },
        { name: 'value', value: '' },
      ],
      input: [{ name: 'IDToken1', value: '' }],
    },
  ],
};

for (const action of ['click', 'Enter', 'submit'] as const) {
  test(`privacy consent requires jurisdiction and agreement before ${action}`, async ({ page }) => {
    const submissions: string[] = [];
    await page.route(
      (url) => url.pathname.endsWith('/authenticate'),
      async (route) => {
        let data;
        try {
          data = route.request().postDataJSON();
        } catch {
          data = null;
        }
        const callback = data?.callbacks?.find(
          (value: { type: string }) => value.type === 'HiddenValueCallback',
        );
        if (callback) submissions.push(callback.input[0].value);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(privacyStep),
        });
      },
    );
    await page.goto('/?journey=AdminOnboarding');
    const form = page.locator('#adminInvitePrivacyPolicyForm');
    const button = form.getByRole('button', { name: 'Continue', exact: true });
    const select = form.locator('select');
    const checkbox = form.locator('input[type=checkbox]');
    await expect(form).toBeVisible();

    async function attempt() {
      if (action === 'click')
        await button.evaluate((element: HTMLButtonElement) => element.click());
      else if (action === 'Enter') await button.press('Enter');
      else await form.evaluate((element: HTMLFormElement) => element.requestSubmit());
      await page.waitForTimeout(100);
    }

    await expect(button).toBeEnabled();
    await attempt();
    expect(submissions).toEqual([]);
    await expect(form.locator('[aria-invalid="true"]').first()).toBeFocused();
    await expect(form.getByText('Value is required', { exact: true }).first()).toBeVisible();
    await checkbox.evaluate((element: HTMLInputElement) => element.click());
    await expect(checkbox).toBeChecked();
    await expect(button).toBeEnabled();
    await attempt();
    expect(submissions).toEqual([]);
    await expect(select).toBeFocused();
    await expect(form.locator('#adminInvitePrivacyPolicyJurisdiction-message')).toBeVisible();
    await checkbox.evaluate((element: HTMLInputElement) => element.click());
    await select.selectOption({ label: 'Rest of the World' });
    await expect(button).toBeEnabled();
    await attempt();
    expect(submissions).toEqual([]);
    await expect(checkbox).toBeFocused();
    await expect(form.locator('#privacyPolicyCheck-message .__input-message')).toBeVisible();
    await form.locator('label[for=privacyPolicyCheck]').click();
    await expect(checkbox).toBeChecked();
    await expect(button).toBeEnabled();
    await form.locator('label[for=privacyPolicyCheck]').click();
    await expect(checkbox).not.toBeChecked();
    await expect(button).toBeEnabled();
    await attempt();
    expect(submissions).toEqual([]);
    await expect(checkbox).toBeFocused();
    await expect(form.locator('#privacyPolicyCheck-message .__input-message')).toBeVisible();
    await form.locator('label[for=privacyPolicyCheck]').click();
    await expect(button).toBeEnabled();
    if (action === 'click') await button.click();
    else if (action === 'Enter') await button.press('Enter');
    else await form.evaluate((element: HTMLFormElement) => element.requestSubmit());
    await expect.poll(() => submissions).toEqual(['Rest of the World']);
  });
}

test('suspended consent resume keeps the mounted callback and URL context', async ({ page }) => {
  const authenticateRequests: string[] = [];
  let documents = 0;
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++;
  });
  await page.route(
    (url) => url.pathname.endsWith('/authenticate'),
    async (route) => {
      authenticateRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(privacyStep),
      });
    },
  );
  await page.goto(
    `/?journey=AdminOnboarding&realm=${AM_REALM}&suspendedId=fixture-used&uuid=retained`,
  );
  const form = page.locator('#adminInvitePrivacyPolicyForm');
  await expect(form).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.has('suspendedId')).toBe(false);
  expect(new URL(page.url()).searchParams.get('realm')).toBe(AM_REALM);
  expect(new URL(page.url()).searchParams.get('journey')).toBe('AdminOnboarding');
  expect(new URL(page.url()).searchParams.get('uuid')).toBe('retained');
  expect(authenticateRequests).toHaveLength(1);
  expect(documents).toBe(1);
  await expect(form.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled();
});

async function privacyForm(page: Page) {
  await page.goto('/?journey=AdminOnboarding');
  const form = page.locator('#adminInvitePrivacyPolicyForm');
  await expect(form).toBeVisible();
  return {
    form,
    button: form.getByRole('button', { name: 'Continue', exact: true }),
    select: form.locator('select'),
  };
}

test('idle consent activation is keyboard reachable and exposes invalid field feedback', async ({
  page,
}) => {
  let submissions = 0;
  await page.route(
    (url) => url.pathname.endsWith('/authenticate'),
    async (route) => {
      if (route.request().postDataJSON()?.callbacks) submissions++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(privacyStep),
      });
    },
  );
  const { form, button, select } = await privacyForm(page);
  await expect(button).toBeEnabled();
  await expect(button).toHaveAttribute('aria-disabled', 'false');
  await expect(button).not.toHaveAttribute('disabled');
  const unfocusedShadow = await button.evaluate((element) => getComputedStyle(element).boxShadow);
  await select.focus();
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  const focus = await button.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      visible: element.matches(':focus-visible'),
      shadow: style.boxShadow,
      outline: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0,
    };
  });
  expect(focus.visible).toBe(true);
  expect(focus.outline || focus.shadow !== unfocusedShadow).toBe(true);
  for (const key of ['Enter', 'Space']) {
    await button.focus();
    await page.keyboard.press(key);
    await expect(select).toBeFocused();
    await expect(select).toHaveAttribute('aria-invalid', 'true');
    await expect(form.locator('#adminInvitePrivacyPolicyJurisdiction-message')).toBeVisible();
  }
  await button.click();
  await form.evaluate((element: HTMLFormElement) => element.requestSubmit());
  await page.waitForTimeout(100);
  expect(submissions).toBe(0);
  await expect(select).toBeFocused();
});

for (const outcome of ['success', 'failure'] as const) {
  test(`consent blocks repeated submission and recovers after ${outcome}`, async ({ page }) => {
    const submissions: string[] = [];
    let release: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    let jurisdiction = '';
    await page.route(
      (url) => url.pathname.endsWith('/authenticate'),
      async (route) => {
        const callback = route
          .request()
          .postDataJSON()
          ?.callbacks?.find((value: { type: string }) => value.type === 'HiddenValueCallback');
        if (callback) {
          jurisdiction = callback.input[0].value;
          submissions.push(jurisdiction);
          if (submissions.length === 1) {
            await pending;
            if (outcome === 'failure') {
              await route.abort('failed');
              return;
            }
          }
        }
        // The synthetic server returns a current callback with the submitted value,
        // including on the normal journey restart after a failed request.
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...privacyStep,
            callbacks: [
              { ...privacyStep.callbacks[0], input: [{ name: 'IDToken1', value: jurisdiction }] },
            ],
          }),
        });
      },
    );
    const { form, button, select } = await privacyForm(page);
    await select.selectOption({ label: 'Rest of the World' });
    await form.locator('label[for=privacyPolicyCheck]').click();
    await expect(button).toBeEnabled();
    await button.focus();
    // Both events run before Svelte flushes the updated loading prop to the stage.
    await form.evaluate((element: HTMLFormElement) => {
      element.requestSubmit();
      element.requestSubmit();
    });
    await expect.poll(() => submissions).toEqual(['Rest of the World']);
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toBeDisabled();
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await button.evaluate((element: HTMLButtonElement) => element.click());
    await form.evaluate((element: HTMLFormElement) => element.requestSubmit());
    await page.waitForTimeout(100);
    expect(submissions).toEqual(['Rest of the World']);
    release();
    await expect(button).toHaveAttribute('aria-busy', 'false');
    await expect(button).toBeEnabled();
    if (outcome === 'failure') {
      await expect(form.locator('#adminInvitePrivacyPolicyFailureMessage')).toBeVisible();
    }
    await button.click();
    await expect.poll(() => submissions).toEqual(['Rest of the World', 'Rest of the World']);
    await expect(button).toHaveAttribute('aria-busy', 'false');
  });
}
