<!--

 Copyright © 2025 - 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
  // Component with slot only - no props needed
</script>

<div class="page-shell tw_flex tw_justify-center tw_min-h-full">
  <div class="tw_containing-box dark:tw_containing-box_dark md:tw_containing-box_medium">
    {@render children?.()}
  </div>
</div>

<style>
  .page-shell {
    background-color: var(
      --fr-page-bg-color,
      hsl(var(--tw-colors-body-light-hs), var(--tw-colors-body-light-l))
    );
    background-image: var(--fr-page-bg-image, none);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    font-family: var(--fr-font-family, 'Open Sans'), ui-sans-serif, system-ui, sans-serif;
  }

  :global(.dark) .page-shell {
    background-color: var(
      --fr-page-bg-color,
      hsl(var(--tw-colors-body-dark-hs), var(--tw-colors-body-dark-l))
    );
  }

  @media (prefers-color-scheme: dark) {
    .page-shell {
      background-color: var(
        --fr-page-bg-color,
        hsl(var(--tw-colors-body-dark-hs), var(--tw-colors-body-dark-l))
      );
    }
  }
</style>
