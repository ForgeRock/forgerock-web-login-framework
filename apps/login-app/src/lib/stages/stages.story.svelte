<!--

 Copyright © 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import AdminRegistration from './admin-registration/admin-registration.svelte';
  import MfaEnrollment from './mfa-enrollment.svelte';

  import type { JourneyStep } from '@forgerock/journey-client/types';

  import type { StageFormObject, StageJourneyObject } from '$journey/journey.interfaces';

  export let form: StageFormObject;
  export let journey: StageJourneyObject;
  export let stage: string;
  export let step: JourneyStep;
</script>

<Centered>
  {#if stage === 'AdminRegistration'}
    <AdminRegistration componentStyle="modal" {form} {journey} {step} />
  {:else if stage === 'MfaEnrollment'}
    <MfaEnrollment componentStyle="modal" {form} {journey} {step} />
  {/if}
</Centered>
