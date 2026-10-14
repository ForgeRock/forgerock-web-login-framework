<!--
  Story wrapper component for header.svelte.

  Approximates the +page.svelte layout: the header wrapper above the journey
  card area, footer wrapper below it. The journey placeholder in between is a
  stand-in for the <Box> that holds the Journey component.
-->

<script lang="ts">
  import Centered from '$components/primitives/box/centered.svelte';
  import { initialize as initializeStyles } from '$core/style.store';
  import Header from '$custom/header/header.svelte';

  /**
   * Initialize the style store with framework defaults (empty object).
   * The wrappers themselves do not read the style store, but the layout
   * primitives around them (dark-mode utilities) expect the theme to be
   * initialized. Pass your own token overrides here to test branded
   * appearances:
   *   initializeStyles({ logoUrl: '/logo.svg', labels: 'floating' })
   */
  initializeStyles({});

  // ─── Props from Storybook args ───────────────────────────────────────────
  /**
   * journeyName — the one prop the framework passes to the header wrapper.
   * Stories below exercise the named-journey, default-journey, and empty
   * cases. Edit freely — the placeholder text is the only other knob.
   */
  export let journeyName = 'Login';

  /**
   * journeyPlaceholder — visible stand-in text for the journey card area.
   * This arg controls only the placeholder between the wrappers, never the
   * wrappers themselves.
   */
  export let journeyPlaceholder = 'Journey renders here (between the custom header and footer)';
</script>

<div class="tw_flex tw_h-screen tw_flex-col">
  <Header {journeyName} />

  <div class="tw_flex-1">
    <Centered>
      <p class="tw_p-8">{journeyPlaceholder}</p>
    </Centered>
  </div>
</div>
