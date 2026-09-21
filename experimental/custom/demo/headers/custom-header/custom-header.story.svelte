<!--
  Story wrapper component for custom-header.svelte.
-->

<script lang="ts">
  /**
   * Centered — a layout primitive that centers its slot content horizontally
   * and vertically inside a constrained box. Used here to approximate the
   * journey card that +page.svelte renders between the header and footer.
   */
  import Centered from '$components/primitives/box/centered.svelte';
  import { initialize as initializeStyles } from '$core/style.store';
  import CustomHeader from './custom-header.svelte';

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
   * behind/below the header, never the header itself.
   */
  export let journeyPlaceholder = 'Journey renders here (below the custom header)';
</script>

<div class="tw_min-h-screen tw_flex tw_flex-col">
  <CustomHeader />

  <div class="tw_flex-1">
    <Centered>
      <p class="tw_p-8">{journeyPlaceholder}</p>
    </Centered>
  </div>
</div>
