<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { interpolate } from '$core/_utilities/i18n.utilities';

  import type { StageJourneyObject } from '$journey/journey.interfaces';
  import { configuredJourneysStore } from '$journey/config.store';

  export let journey: StageJourneyObject;

  let stack = journey.stack;
  let string = '';

  $: {
    // The parent can pass a new `journey` object; update `stack` so `$stack` reads from the latest store.
    stack = journey.stack;

    const currentJourney = $configuredJourneysStore.find((journey) => {
      return journey.journey === $stack[$stack.length - 2]?.journey;
    });

    const key = currentJourney?.key;
    const capitalizedKey =
      typeof key === 'string' ? key.replace(/([a-z])/, (_, char) => `${char.toUpperCase()}`) : key;
    string = `backTo${capitalizedKey || 'Default'}`;
  }
</script>

{#if $stack.length > 1}
  <p class=" tw_my-4 tw_text-base tw_text-center tw_text-link-dark dark:tw_text-link-light">
    <button
      on:click|preventDefault={() => {
        journey?.pop();
      }}
    >
      {interpolate(string)}
    </button>
  </p>
{/if}
