<!--
  Story wrapper for the __COMPONENT_NAME__ header. Mounts the component above
  a stand-in journey card so it renders in isolation inside Storybook the way
  the login app renders it above the real journey container.
-->

<script lang="ts">
  import { Centered, initializeStyles } from '$login-framework';
  import __COMPONENT_NAME_PASCAL__ from './__COMPONENT_SLUG__.svelte';

  /**
   * Initialize the style store with framework defaults (empty object).
   * The header itself does not read the style store, but the layout primitives
   * around it (dark-mode utilities) expect the theme to be initialized.
   * Pass your own token overrides here to test branded appearances:
   *   initializeStyles({ logoUrl: '/logo.svg', labels: 'floating' })
   */
  initializeStyles({});

  // ─── Props from Storybook args ───────────────────────────────────────────
  /**
   * journeyPlaceholder — visible stand-in text for the journey card area.
   * Header components take no props, so this arg controls only the placeholder
   * below the header, never the header itself.
   */
  export let journeyPlaceholder = 'Journey renders here (below the custom header)';
</script>

<div class="tw_min-h-screen tw_flex tw_flex-col">
  <svelte:component this={__COMPONENT_NAME_PASCAL__} />

  <div class="tw_flex-1">
    <Centered>
      <p class="tw_p-8">{journeyPlaceholder}</p>
    </Centered>
  </div>
</div>
