<!--

 Copyright © 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import T from '$components/_utilities/locale-strings.svelte';
  import Text from '$components/primitives/text/text.svelte';
  import { styleStore } from '$core/style.store';

  export let componentStyle: 'app' | 'inline' | 'modal';

  const formHeaderId = 'adminInviteInvalidHeader';
</script>

{#if $styleStore?.logo && componentStyle !== 'inline'}
  <div class="tw_flex tw_justify-center tw_mb-6">
    <div class="tw_dialog-logo tw_stage-logo dark:tw_dialog-logo_dark"></div>
  </div>
{/if}

<header id={formHeaderId}>
  <h1 class="tw_primary-header dark:tw_primary-header_dark">
    <T key="adminRegInvalidInviteHeader" />
  </h1>
  <Text classes="tw_text-center tw_-mt-5 tw_mb-4 tw_py-4">
    <T html={true} key="adminRegInvalidInviteDescription" />
  </Text>
</header>
