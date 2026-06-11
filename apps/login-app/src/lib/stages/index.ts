/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';

import AdminInviteInvalid from './admin-invite-invalid.svelte';
import AdminInvitePrivacyPolicy from './admin-invite-privacy-policy.svelte';
import AdminInviteVerifyCode from './admin-invite-verify-code.svelte';
import AdminInviteWelcome from './admin-invite-welcome.svelte';
import MfaAppStoreLinks from './mfa-app-store-links.svelte';
import MfaDownloadApp from './mfa-download-app.svelte';
import MfaSetupPrompt from './mfa-setup-prompt.svelte';

import type { HiddenValueCallback, TextOutputCallback } from '@forgerock/journey-client/types';

import type { StageRegistryEntry } from '$journey/journey.interfaces';

export const loginAppStages: Record<string, StageRegistryEntry> = {
  AdminInvitePrivacyPolicy: {
    component: AdminInvitePrivacyPolicy,
    detect: (step) => {
      const hiddenValueCallbacks = step.getCallbacksOfType(
        callbackType.HiddenValueCallback,
      ) as HiddenValueCallback[];
      return hiddenValueCallbacks.some((cb) =>
        (cb.getOutputByName('id', '') as string).startsWith('jurisdiction-input-'),
      );
    },
  },
  AdminInviteVerifyCode: {
    component: AdminInviteVerifyCode,
    detect: (step) => {
      const hiddenValueCallbacks = step.getCallbacksOfType(
        callbackType.HiddenValueCallback,
      ) as HiddenValueCallback[];
      return hiddenValueCallbacks.some(
        (cb) => (cb.getOutputByName('id', '') as string) === 'p1aic-otp-answer',
      );
    },
  },
  MfaDownloadApp: {
    component: MfaDownloadApp,
    detect: (step) => {
      const hiddenValueCallbacks = step.getCallbacksOfType(
        callbackType.HiddenValueCallback,
      ) as HiddenValueCallback[];
      return hiddenValueCallbacks.some((cb) =>
        (cb.getOutputByName('id', '') as string).startsWith('getapp-'),
      );
    },
  },
  MfaSetupPrompt: {
    component: MfaSetupPrompt,
    detect: (step) => {
      const hiddenValueCallbacks = step.getCallbacksOfType(
        callbackType.HiddenValueCallback,
      ) as HiddenValueCallback[];
      return hiddenValueCallbacks.some((cb) =>
        (cb.getOutputByName('id', '') as string).startsWith('skip-'),
      );
    },
  },
  AdminInviteInvalid: {
    component: AdminInviteInvalid,
    detect: (step) => {
      const textOutputCallbacks = step.getCallbacksOfType(
        callbackType.TextOutputCallback,
      ) as TextOutputCallback[];
      return textOutputCallbacks
        .filter((cb) => cb.getMessageType() === '4')
        .some((cb) => cb.getMessage().includes('Invitation not valid'));
    },
  },
  AdminInviteWelcome: {
    component: AdminInviteWelcome,
    detect: (step) => {
      const textOutputCallbacks = step.getCallbacksOfType(
        callbackType.TextOutputCallback,
      ) as TextOutputCallback[];
      return textOutputCallbacks
        .filter((cb) => cb.getMessageType() === '4')
        .some((cb) => cb.getMessage().includes('p1aic-tenant-name'));
    },
  },
  MfaAppStoreLinks: {
    component: MfaAppStoreLinks,
    detect: (step) => {
      const textOutputCallbacks = step.getCallbacksOfType(
        callbackType.TextOutputCallback,
      ) as TextOutputCallback[];
      return textOutputCallbacks
        .filter((cb) => cb.getMessageType() === '4')
        .some(
          (cb) =>
            cb.getMessage().includes('itunes.apple.com') ||
            cb.getMessage().includes('play.google.com'),
        );
    },
  },
};
