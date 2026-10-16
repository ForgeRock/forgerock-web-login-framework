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
      else if (action === 'Enter') await select.press('Enter');
      else await form.evaluate((element: HTMLFormElement) => element.requestSubmit());
      await page.waitForTimeout(100);
    }

    await expect(button).toBeDisabled();
    await attempt();
    expect(submissions).toEqual([]);
    await checkbox.evaluate((element: HTMLInputElement) => element.click());
    await expect(checkbox).toBeChecked();
    await expect(button).toBeDisabled();
    await attempt();
    expect(submissions).toEqual([]);
    await checkbox.evaluate((element: HTMLInputElement) => element.click());
    await select.selectOption({ label: 'Rest of the World' });
    await expect(button).toBeDisabled();
    await attempt();
    expect(submissions).toEqual([]);
    await form.locator('label[for=privacyPolicyCheck]').click();
    await expect(checkbox).toBeChecked();
    await expect(button).toBeEnabled();
    await form.locator('label[for=privacyPolicyCheck]').click();
    await expect(checkbox).not.toBeChecked();
    await expect(button).toBeDisabled();
    await attempt();
    expect(submissions).toEqual([]);
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
  await expect(form.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
});
