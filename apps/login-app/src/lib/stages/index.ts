/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import AdminInviteInvalid from './admin-invite-invalid.svelte';
import AdminInvitePrivacyPolicy from './admin-invite-privacy-policy.svelte';
import AdminInviteVerifyCode from './admin-invite-verify-code.svelte';
import AdminInviteWelcome from './admin-invite-welcome.svelte';
import MfaAppStoreLinks from './mfa-app-store-links.svelte';
import MfaDownloadApp from './mfa-download-app.svelte';
import MfaSetupPrompt from './mfa-setup-prompt.svelte';

import type { StageComponent } from '$journey/journey.interfaces';

export const appStages: Record<string, StageComponent> = {
  AdminInviteInvalid,
  AdminInvitePrivacyPolicy,
  AdminInviteVerifyCode,
  AdminInviteWelcome,
  MfaAppStoreLinks,
  MfaDownloadApp,
  MfaSetupPrompt,
};
