/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';

import type { Step } from '@forgerock/journey-client/types';

const mockAuthId = 'mock-auth-id';

export const adminRegWelcomeStep: Step = {
  authId: mockAuthId,
  callbacks: [
    {
      type: callbackType.TextOutputCallback,
      output: [
        {
          name: 'message',
          value: '<span class="p1aic-tenant-name">my-tenant</span>',
        },
        { name: 'messageType', value: '4' },
      ],
    },
  ],
};

export const adminRegOtpStep: Step = {
  authId: mockAuthId,
  callbacks: [
    {
      type: callbackType.HiddenValueCallback,
      output: [
        { name: 'value', value: '' },
        { name: 'id', value: 'p1aic-otp-answer' },
      ],
      input: [{ name: 'IDToken1', value: 'p1aic-otp-answer' }],
    },
  ],
};

export const adminRegOtpErrorStep: Step = {
  authId: mockAuthId,
  callbacks: [
    {
      type: callbackType.TextOutputCallback,
      output: [
        {
          name: 'message',
          value:
            "if (true) {\n          retryWarning.className = 'p1aic-otp-retry-warning';\n        }",
        },
        { name: 'messageType', value: '4' },
      ],
    },
    {
      type: callbackType.HiddenValueCallback,
      output: [
        { name: 'value', value: '' },
        { name: 'id', value: 'p1aic-otp-answer' },
      ],
      input: [{ name: 'IDToken2', value: 'p1aic-otp-answer' }],
    },
  ],
};

export const adminRegPrivacyPolicyStep: Step = {
  authId: mockAuthId,
  callbacks: [
    {
      type: callbackType.HiddenValueCallback,
      output: [
        { name: 'value', value: '' },
        { name: 'id', value: 'jurisdiction-input-995' },
      ],
      input: [{ name: 'IDToken1', value: 'jurisdiction-input-995' }],
    },
  ],
};

export const adminRegInvalidInviteStep: Step = {
  authId: mockAuthId,
  callbacks: [
    {
      type: callbackType.TextOutputCallback,
      output: [
        { name: 'message', value: 'Invitation not valid' },
        { name: 'messageType', value: '4' },
      ],
    },
  ],
};

export const mfaEnrollmentStep: Step = {
  authId: mockAuthId,
  callbacks: [
    {
      type: callbackType.TextOutputCallback,
      output: [
        { name: 'message', value: 'Loading...' },
        { name: 'messageType', value: '0' },
      ],
    },
    {
      type: callbackType.ConfirmationCallback,
      output: [
        { name: 'prompt', value: '' },
        { name: 'messageType', value: 0 },
        { name: 'options', value: ['Set up'] },
        { name: 'optionType', value: -1 },
        { name: 'defaultOption', value: 0 },
      ],
      input: [{ name: 'IDToken2', value: 0 }],
    },
    {
      type: callbackType.HiddenValueCallback,
      output: [
        { name: 'value', value: 'false' },
        { name: 'id', value: 'skip-input-223' },
      ],
      input: [{ name: 'IDToken3', value: 'skip-input-223' }],
    },
    {
      type: callbackType.TextOutputCallback,
      output: [
        {
          name: 'message',
          value:
            "var setupPage = function() { messageElem.innerHTML = \"<h2 class=h2>Set up 2-step verification</h2><div style='margin-bottom:1em;padding:0 1em'>To protect your account, add a second<br>authentication method.<div class='alert alert-warning' style='margin-top:1.5em'>Starting April 2, 2024, you must sign in using<br>2-step verification. Learn more <a class='alert-link' href='https://backstage.forgerock.com/docs/idcloud/latest/product-information/migration-dependent-features/tenant-administrator-mandatory-2-step-verification-faq.html'>here</a>.</div></div>\"; };setupPage();",
        },
        { name: 'messageType', value: '4' },
      ],
    },
  ],
};

export const getAuthenticatorAppStep: Step = {
  authId: mockAuthId,
  callbacks: [
    {
      type: callbackType.TextOutputCallback,
      output: [
        { name: 'message', value: 'Loading...' },
        { name: 'messageType', value: '0' },
      ],
    },
    {
      type: callbackType.ConfirmationCallback,
      output: [
        { name: 'prompt', value: '' },
        { name: 'messageType', value: 0 },
        { name: 'options', value: ['Next'] },
        { name: 'optionType', value: -1 },
        { name: 'defaultOption', value: 0 },
      ],
      input: [{ name: 'IDToken2', value: 0 }],
    },
    {
      type: callbackType.HiddenValueCallback,
      output: [
        { name: 'value', value: 'false' },
        { name: 'id', value: 'getapp-input-008' },
      ],
      input: [{ name: 'IDToken3', value: 'getapp-input-008' }],
    },
    {
      type: callbackType.TextOutputCallback,
      output: [
        {
          name: 'message',
          value:
            "var setupPage = function() { messageElem.innerHTML = \"<h2 class='h2'>Set up the ForgeRock Authenticator</h2><div style='margin-bottom:1em'>To get started, you need to register your device using the ForgeRock Authenticator app.</div>\"; };setupPage();",
        },
        { name: 'messageType', value: '4' },
      ],
    },
  ],
};

export const getAuthenticatorAppLinksStep: Step = {
  authId: mockAuthId,
  callbacks: [
    {
      type: callbackType.TextOutputCallback,
      output: [
        {
          name: 'message',
          value:
            'document.getElementById("callback_0").innerHTML="<center>Get the app from the <a href=\'https://itunes.apple.com/app/forgerock-authenticator/id1038442926\'>Apple App Store</a> or on <a href=\'https://play.google.com/store/apps/details?id=com.forgerock.authenticator\'>Google Play Store</a></center>"',
        },
        { name: 'messageType', value: '4' },
      ],
    },
    {
      type: callbackType.ConfirmationCallback,
      output: [
        { name: 'prompt', value: '' },
        { name: 'messageType', value: 0 },
        { name: 'options', value: ['Continue'] },
        { name: 'optionType', value: -1 },
        { name: 'defaultOption', value: 0 },
      ],
      input: [{ name: 'IDToken2', value: 0 }],
    },
  ],
};
