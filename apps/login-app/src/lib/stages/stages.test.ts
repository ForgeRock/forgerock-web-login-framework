/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it } from 'vitest';

import { createJourneyStep } from '$journey/_utilities/step.mock';
import { loginAppStages } from './index';
import {
  adminRegInvalidInviteStep,
  adminRegOtpErrorStep,
  adminRegOtpStep,
  adminRegPrivacyPolicyStep,
  adminRegWelcomeStep,
  getAuthenticatorAppLinksStep,
  getAuthenticatorAppStep,
  mfaEnrollmentStep,
} from './stages.mock';

import type { Step } from '@forgerock/journey-client/types';

describe('loginAppStages detect functions — login-app stages', () => {
  // Admin invite stages
  it('AdminInviteWelcome detects p1aic-tenant-name type-4 script', () => {
    const step = createJourneyStep(adminRegWelcomeStep as Step);
    expect(loginAppStages['AdminInviteWelcome'].detect(step)).toBe(true);
  });

  it('AdminInviteVerifyCode detects p1aic-otp-answer hidden value', () => {
    const step = createJourneyStep(adminRegOtpStep as Step);
    expect(loginAppStages['AdminInviteVerifyCode'].detect(step)).toBe(true);
  });

  it('AdminInviteVerifyCode detects p1aic-otp-answer hidden value with retry script', () => {
    const step = createJourneyStep(adminRegOtpErrorStep as Step);
    expect(loginAppStages['AdminInviteVerifyCode'].detect(step)).toBe(true);
  });

  it('AdminInvitePrivacyPolicy detects jurisdiction-input hidden value', () => {
    const step = createJourneyStep(adminRegPrivacyPolicyStep as Step);
    expect(loginAppStages['AdminInvitePrivacyPolicy'].detect(step)).toBe(true);
  });

  it('AdminInviteInvalid detects Invitation not valid type-4 script', () => {
    const step = createJourneyStep(adminRegInvalidInviteStep as Step);
    expect(loginAppStages['AdminInviteInvalid'].detect(step)).toBe(true);
  });

  // MFA stages
  it('MfaSetupPrompt detects skip- hidden value', () => {
    const step = createJourneyStep(mfaEnrollmentStep as Step);
    expect(loginAppStages['MfaSetupPrompt'].detect(step)).toBe(true);
  });

  it('MfaDownloadApp detects getapp- hidden value', () => {
    const step = createJourneyStep(getAuthenticatorAppStep as Step);
    expect(loginAppStages['MfaDownloadApp'].detect(step)).toBe(true);
  });

  it('MfaAppStoreLinks detects app store link type-4 script', () => {
    const step = createJourneyStep(getAuthenticatorAppLinksStep as Step);
    expect(loginAppStages['MfaAppStoreLinks'].detect(step)).toBe(true);
  });

  // Non-matching steps should not detect
  it('AdminInviteWelcome does not match OTP step', () => {
    const step = createJourneyStep(adminRegOtpStep as Step);
    expect(loginAppStages['AdminInviteWelcome'].detect(step)).toBe(false);
  });

  it('MfaSetupPrompt does not match MfaDownloadApp step', () => {
    const step = createJourneyStep(getAuthenticatorAppStep as Step);
    expect(loginAppStages['MfaSetupPrompt'].detect(step)).toBe(false);
  });
});
