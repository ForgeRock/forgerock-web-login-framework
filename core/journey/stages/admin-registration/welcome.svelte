<!--

 Copyright © 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import T from '$components/_utilities/locale-strings.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import Text from '$components/primitives/text/text.svelte';

  import type { StageJourneyObject } from '$journey/journey.interfaces';

  export let componentStyle: 'app' | 'inline' | 'modal';
  export let headerId: string;
  export let journey: StageJourneyObject;
  export let tenantName: string;
</script>

<!-- suppress header in inline mode — the host page provides its own heading structure -->
{#if componentStyle !== 'inline'}
  <header id={headerId}>
    <h1 class="tw_primary-header dark:tw_primary-header_dark">
      <T key="adminRegWelcomeHeader" />
    </h1>
    <Text classes="tw_-mt-5 tw_mb-2 tw_py-4">
      <T key="adminRegWelcomeDescriptionPre" /> <strong>{tenantName}</strong>
      <T key="adminRegWelcomeDescriptionPost" />
    </Text>
    <Text classes="tw_-mt-5 tw_mb-2 tw_py-4">
      <T key="adminRegWelcomeVerification" />
    </Text>
  </header>
{/if}

<Button busy={journey?.loading} style="primary" type="submit" width="full">
  <T key="adminRegSendVerificationCode" />
</Button>
