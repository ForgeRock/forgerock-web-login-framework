/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, test } from '@playwright/test';

import { asyncEvents } from '../../utilities/async-events.js';

async function blockRecaptchaScript(page) {
  await page.route('**/recaptcha/**', (route) => route.abort());
}

async function stubGrecaptchaClassic(page) {
  await blockRecaptchaScript(page);
  await page.addInitScript(() => {
    window.__grecaptchaRenderArgs = null;
    window.grecaptcha = {
      ready: (cb) => cb(),
      render: (el, opts) => {
        window.__grecaptchaRenderArgs = { el, opts };
        if (typeof opts.callback === 'function') {
          opts.callback('classic-token');
        } else if (typeof window[opts.callback] === 'function') {
          window[opts.callback]('classic-token');
        }
        return 'widget-id';
      },
      execute: (siteKey, o) => {
        window.__grecaptchaExecuteArgs = { siteKey, action: o?.action };
        return Promise.resolve('classic-token');
      },
      reset: () => undefined,
      getResponse: () => 'classic-token',
    };
  });
}

async function stubGrecaptchaEnterprise(page) {
  await blockRecaptchaScript(page);
  await page.addInitScript(() => {
    window.__grecaptchaEnterpriseExecuteArgs = null;
    window.grecaptcha = {
      enterprise: {
        ready: (cb) => cb(),
        render: () => 'widget-id',
        execute: (siteKey, o) => {
          window.__grecaptchaEnterpriseExecuteArgs = { siteKey, action: o?.action };
          return Promise.resolve('enterprise-token');
        },
        reset: () => undefined,
        getResponse: () => 'enterprise-token',
      },
    };
  });
}

function routeAuthenticate(page, firstCallbacks, onSubmit) {
  let count = 0;
  return page.route('**/authenticate**', async (route) => {
    count += 1;
    if (count === 1) {
      await route.fulfill({
        status: 200,
        json: { authId: 'mock-captcha-auth-id', callbacks: firstCallbacks },
      });
      return;
    }
    const body = route.request().postDataJSON();
    onSubmit?.(body);
    await route.fulfill({
      status: 200,
      json: {
        authId: 'mock-captcha-success',
        callbacks: [
          {
            type: 'TextOutputCallback',
            output: [
              { name: 'message', value: 'Captcha submitted.' },
              { name: 'messageType', value: '0' },
            ],
            _id: 0,
          },
        ],
      },
    });
  });
}

test('Classic ReCaptcha visible submits token from grecaptcha', async ({ page }) => {
  await stubGrecaptchaClassic(page);
  const submitted = [];
  await routeAuthenticate(
    page,
    [
      {
        type: 'ReCaptchaCallback',
        output: [
          { name: 'recaptchaSiteKey', value: 'classic-site-key' },
          { name: 'captchaDivClass', value: 'g-recaptcha' },
          { name: 'reCaptchaV3', value: false },
        ],
        input: [{ name: 'IDToken1', value: '' }],
        _id: 0,
      },
    ],
    (body) => submitted.push(body),
  );

  const { clickButton, navigate } = asyncEvents(page);
  await navigate('widget/modal?journey=TEST_Login');
  await clickButton('Open Login Modal', '/authenticate');

  await page.waitForFunction(() => window.__grecaptchaRenderArgs !== null);
  await clickButton('Next', '/authenticate');
  await expect(page.getByText('Captcha submitted.')).toBeVisible();

  expect(submitted[0].callbacks[0].input[0].value).toBe('classic-token');
});

test('ReCaptchaEnterpriseCallback visible renders via enterprise namespace', async ({ page }) => {
  await stubGrecaptchaEnterprise(page);
  await routeAuthenticate(page, [
    {
      type: 'ReCaptchaEnterpriseCallback',
      output: [
        { name: 'recaptchaSiteKey', value: 'enterprise-site-key' },
        { name: 'captchaApiUri', value: 'https://www.google.com/recaptcha/enterprise.js' },
        { name: 'captchaDivClass', value: 'g-recaptcha' },
      ],
      input: [
        { name: 'IDToken1token', value: '' },
        { name: 'IDToken1action', value: '' },
        { name: 'IDToken1clientError', value: '' },
        { name: 'IDToken1payload', value: '' },
      ],
      _id: 0,
    },
  ]);

  const { clickButton, navigate } = asyncEvents(page);
  await navigate('widget/modal?journey=TEST_Login');
  await clickButton('Open Login Modal', '/authenticate');

  await expect(page.locator('#fr-recaptcha-enterprise')).toBeAttached();
});

test('ReCaptchaEnterpriseCallback invisible executes with action and submits token', async ({
  page,
}) => {
  await stubGrecaptchaEnterprise(page);
  const submitted = [];
  await routeAuthenticate(
    page,
    [
      {
        type: 'ReCaptchaEnterpriseCallback',
        output: [
          { name: 'recaptchaSiteKey', value: 'enterprise-site-key' },
          { name: 'captchaApiUri', value: 'https://www.google.com/recaptcha/enterprise.js' },
          { name: 'captchaDivClass', value: 'g-recaptcha' },
        ],
        input: [
          { name: 'IDToken1token', value: '' },
          { name: 'IDToken1action', value: '' },
          { name: 'IDToken1clientError', value: '' },
          { name: 'IDToken1payload', value: '' },
        ],
        _id: 0,
      },
    ],
    (body) => submitted.push(body),
  );

  const { clickButton, navigate } = asyncEvents(page);
  await navigate('widget/modal?journey=TEST_Login&captchaMode=invisible&recaptchaAction=LOGIN');
  await clickButton('Open Login Modal', '/authenticate');

  await page.waitForFunction(() => window.__grecaptchaEnterpriseExecuteArgs !== null);
  const args = await page.evaluate(() => window.__grecaptchaEnterpriseExecuteArgs);
  expect(args).toEqual({ siteKey: 'enterprise-site-key', action: 'LOGIN' });

  await clickButton('Next', '/authenticate');
  await expect(page.getByText('Captcha submitted.')).toBeVisible();
  expect(submitted[0].callbacks[0].input[0].value).toBe('enterprise-token');
  expect(submitted[0].callbacks[0].input[1].value).toBe('LOGIN');
});
