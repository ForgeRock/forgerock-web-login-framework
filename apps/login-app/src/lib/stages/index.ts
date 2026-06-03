/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import AdminRegistration from './admin-registration/admin-registration.svelte';
import MfaEnrollment from './mfa-enrollment.svelte';

import type { StageComponent } from '$journey/journey.interfaces';

export const appStages: Record<string, StageComponent> = {
  AdminRegistration,
  MfaEnrollment,
};
