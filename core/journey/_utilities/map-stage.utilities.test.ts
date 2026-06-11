/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it, vi } from 'vitest';

// Isolate the core mapping logic from any demo overrides in the custom registry.
vi.mock('./registry/custom-registry', () => ({
  customStageRegistry: {},
  customCallbackRegistry: {},
}));

import { createJourneyStep } from '$journey/_utilities/step.mock';
import Generic from '$journey/stages/generic.svelte';
import Login from '$journey/stages/login.svelte';
import {
  createMixedLoginWebAuthnStep,
  getAuthenticatorAppLinksStep,
  getAuthenticatorAppStep,
  mfaEnrollmentStep,
} from '$journey/stages/mfa-stages.mock';
import {
  adminRegInvalidInviteStep,
  adminRegOtpErrorStep,
  adminRegOtpStep,
  adminRegPrivacyPolicyStep,
  adminRegWelcomeStep,
} from '$journey/stages/step.mock';
import { mapStepToStage } from './map-stage.utilities';
import { step1, step3 } from './step.mock';

import type { Step } from '@forgerock/journey-client/types';

import type { StageComponent } from '$journey/journey.interfaces';

const MockAdminInviteWelcome = {} as StageComponent;
const MockAdminInviteVerifyCode = {} as StageComponent;
const MockAdminInvitePrivacyPolicy = {} as StageComponent;
const MockAdminInviteInvalid = {} as StageComponent;
const MockMfaSetupPrompt = {} as StageComponent;
const MockMfaDownloadApp = {} as StageComponent;
const MockMfaAppStoreLinks = {} as StageComponent;

const mockStages = {
  AdminInviteWelcome: MockAdminInviteWelcome,
  AdminInviteVerifyCode: MockAdminInviteVerifyCode,
  AdminInvitePrivacyPolicy: MockAdminInvitePrivacyPolicy,
  AdminInviteInvalid: MockAdminInviteInvalid,
  MfaSetupPrompt: MockMfaSetupPrompt,
  MfaDownloadApp: MockMfaDownloadApp,
  MfaAppStoreLinks: MockMfaAppStoreLinks,
};

describe('Test mapping of step to stage', () => {
  it('should map to a given stage for a known step', () => {
    const result = mapStepToStage(step3);

    expect(result).toStrictEqual(Login);
  });

  it('should map to a generic stage for an unknown step', () => {
    const result = mapStepToStage(step1);

    expect(result).toStrictEqual(Generic);
  });

  it('maps mixed login WebAuthn steps without a stage to Login', () => {
    const mixed = createMixedLoginWebAuthnStep('auth-no-stage');
    const { stage: _ignored, ...payloadWithoutStage } = mixed.payload as Step;
    const mixedWithoutStage = createJourneyStep(payloadWithoutStage as Step);

    const result = mapStepToStage(mixedWithoutStage);
    expect(result).toStrictEqual(Login);
  });

  // MFA stages
  it('maps steps with HiddenValueCallback id starting with skip- to MfaSetupPrompt', () => {
    const result = mapStepToStage(createJourneyStep(mfaEnrollmentStep as Step), mockStages);
    expect(result).toStrictEqual(MockMfaSetupPrompt);
  });

  it('maps steps with HiddenValueCallback id starting with getapp- to MfaDownloadApp', () => {
    const result = mapStepToStage(createJourneyStep(getAuthenticatorAppStep as Step), mockStages);
    expect(result).toStrictEqual(MockMfaDownloadApp);
  });

  it('maps steps with type-4 app-links script to MfaAppStoreLinks', () => {
    const result = mapStepToStage(
      createJourneyStep(getAuthenticatorAppLinksStep as Step),
      mockStages,
    );
    expect(result).toStrictEqual(MockMfaAppStoreLinks);
  });

  it('falls back to Generic when MfaSetupPrompt step has no stages provided', () => {
    const result = mapStepToStage(createJourneyStep(mfaEnrollmentStep as Step));
    expect(result).toStrictEqual(Generic);
  });

  // Admin invite stages
  it('maps admin invite welcome step (p1aic-tenant-name script) to AdminInviteWelcome', () => {
    const result = mapStepToStage(createJourneyStep(adminRegWelcomeStep as Step), mockStages);
    expect(result).toStrictEqual(MockAdminInviteWelcome);
  });

  it('maps admin invite OTP step (p1aic-otp-answer hidden) to AdminInviteVerifyCode', () => {
    const result = mapStepToStage(createJourneyStep(adminRegOtpStep as Step), mockStages);
    expect(result).toStrictEqual(MockAdminInviteVerifyCode);
  });

  it('maps admin invite OTP error step (p1aic-otp-answer hidden + if(true) retry script) to AdminInviteVerifyCode', () => {
    const result = mapStepToStage(createJourneyStep(adminRegOtpErrorStep as Step), mockStages);
    expect(result).toStrictEqual(MockAdminInviteVerifyCode);
  });

  it('maps admin invite privacy policy step (jurisdiction-input hidden) to AdminInvitePrivacyPolicy', () => {
    const result = mapStepToStage(createJourneyStep(adminRegPrivacyPolicyStep as Step), mockStages);
    expect(result).toStrictEqual(MockAdminInvitePrivacyPolicy);
  });

  it('maps admin invite invalid step (Invitation not valid script) to AdminInviteInvalid', () => {
    const result = mapStepToStage(createJourneyStep(adminRegInvalidInviteStep as Step), mockStages);
    expect(result).toStrictEqual(MockAdminInviteInvalid);
  });

  it('falls back to Generic when AdminInviteWelcome step has no stages provided', () => {
    const result = mapStepToStage(createJourneyStep(adminRegWelcomeStep as Step));
    expect(result).toStrictEqual(Generic);
  });
});
