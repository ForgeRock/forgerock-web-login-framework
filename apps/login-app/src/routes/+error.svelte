<!--

 Copyright © 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';

  function getErrorMessage(err: unknown): string {
    if (typeof err === 'string') {
      return err;
    }

    const maybe = err as { message?: unknown; body?: { message?: unknown } } | null | undefined;
    const message = maybe?.body?.message ?? maybe?.message;
    return typeof message === 'string' ? message : 'An unexpected error occurred.';
  }

  let message = $derived(getErrorMessage(page.error));
</script>

<div
  class="tw_bg-body-light dark:tw_bg-body-dark tw_min-h-screen tw_flex tw_items-center tw_justify-center tw_p-6"
>
  <div
    class="tw_containing-box dark:tw_containing-box_dark md:tw_containing-box_medium tw_flex tw_flex-col tw_items-center tw_text-center tw_gap-4"
  >
    <h1 class="tw_primary-header dark:tw_primary-header_dark">Configuration error</h1>
    <p class="tw_text-secondary-dark dark:tw_text-secondary-light">{message}</p>
    <p class="tw_text-secondary-dark dark:tw_text-secondary-light">Status: {page.status}</p>
  </div>
</div>
