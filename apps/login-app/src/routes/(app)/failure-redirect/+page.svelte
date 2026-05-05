<!--

 Copyright © 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import ShieldIcon from '$components/icons/shield-icon.svelte';
  import Box from '$components/primitives/box/centered.svelte';
</script>

<Box>
  <div class="tw_flex tw_flex-col tw_items-center tw_text-center tw_gap-4">
    <div class="tw_flex tw_justify-center">
      <ShieldIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
    </div>

    <h1 class="tw_primary-header dark:tw_primary-header_dark">Sign-in failed</h1>
    <p class="tw_text-secondary-dark dark:tw_text-secondary-light">
      We couldn’t redirect you automatically.
    </p>
    <p class="tw_text-secondary-dark dark:tw_text-secondary-light">
      Return to the application and try signing in again.
    </p>
  </div>
</Box>
