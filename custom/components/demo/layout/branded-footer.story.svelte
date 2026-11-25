<!--
  Story wrapper component for branded-footer.svelte.

  Mirrors the +page.svelte layout: the journey card area above, the branded
  footer below. The journey placeholder in between is a stand-in for the <Box>
  that holds the Journey component.
-->

<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import { initialize as initializeStyles } from '$core/style.store';
  import BrandedFooter from './branded-footer.svelte';

  /**
   * Initialize the style store with framework defaults (empty object).
   * Pass your own token overrides here to test branded appearances:
   *   initializeStyles({ logoUrl: '/logo.svg', labels: 'floating' })
   */
  initializeStyles({});

  // ─── Props from Storybook args ───────────────────────────────────────────
  /**
   * journeyName — the one prop the framework passes to the wrapper.
   * Stories below exercise the default-journey (''), named-journey, and
   * Register cases.
   */
  export let journeyName = '';

  /**
   * journeyPlaceholder — visible stand-in text for the journey card area.
   * This arg controls only the placeholder above the footer, never the
   * footer itself.
   */
  export let journeyPlaceholder = 'Journey renders here (between the custom header and footer)';
</script>

<div class="tw_flex tw_h-screen tw_flex-col">
  <div class="tw_flex-1">
    <Centered>
      <p class="tw_p-8">{journeyPlaceholder}</p>
    </Centered>
  </div>

  <BrandedFooter {journeyName} />
</div>
