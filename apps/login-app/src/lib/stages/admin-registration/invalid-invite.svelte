<!--

 Copyright © 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import T from '$components/_utilities/locale-strings.svelte';
  import Text from '$components/primitives/text/text.svelte';

  export let headerId: string;
</script>

<header id={headerId}>
  <h1 class="tw_primary-header dark:tw_primary-header_dark">
    <T key="adminRegInvalidInviteHeader" />
  </h1>
  <Text classes="tw_text-center tw_-mt-5 tw_mb-4 tw_py-4">
    <T html={true} key="adminRegInvalidInviteDescription" />
  </Text>
</header>
