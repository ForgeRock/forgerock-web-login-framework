<!--
  Story wrapper for the __COMPONENT_NAME__ footer. Mounts the component below
  a stand-in journey card so it renders in isolation inside Storybook the way
  the login app renders it below the real journey container.
-->

<script lang="ts">
  import { Centered, initializeStyles } from '$login-framework';
  import __COMPONENT_NAME_PASCAL__ from './__COMPONENT_SLUG__.svelte';

  /**
   * Initialize the style store with framework defaults (empty object).
   * The footer itself does not read the style store, but the layout primitives
   * around it (dark-mode utilities) expect the theme to be initialized.
   * Pass your own token overrides here to test branded appearances:
   *   initializeStyles({ logoUrl: '/logo.svg', labels: 'floating' })
   */
  initializeStyles({});

  // ─── Props from Storybook args ───────────────────────────────────────────
  /**
   * journeyPlaceholder — visible stand-in text for the journey card area.
   * Footer components take no props, so this arg controls only the placeholder
   * above the footer, never the footer itself.
   */
  export let journeyPlaceholder = 'Journey renders here (above the custom footer)';
</script>

<div class="tw_min-h-screen tw_flex tw_flex-col">
  <div class="tw_flex-1">
    <Centered>
      <p class="tw_p-8">{journeyPlaceholder}</p>
    </Centered>
  </div>

  <svelte:component this={__COMPONENT_NAME_PASCAL__} />
</div>
