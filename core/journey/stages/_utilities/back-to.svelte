<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { preventDefault } from 'svelte/legacy';

  import { interpolate } from '$core/_utilities/i18n.utilities';
  import { configuredJourneysStore } from '$journey/config.store';

  import type { StageJourneyObject } from '$journey/journey.interfaces';

  interface Props {
    journey: StageJourneyObject;
  }

  let { journey }: Props = $props();

  let stack = $state(journey.stack);
  let string = $state('');

  $effect.pre(() => {
    // The parent can pass a new `journey` object; update `stack` so `$stack` reads from the latest store.
    stack = journey.stack;

    const currentJourney = $configuredJourneysStore.find((journey) => {
      return journey.journey === $stack[$stack.length - 2]?.journey;
    });

    const key = currentJourney?.key;
    const capitalizedKey =
      typeof key === 'string' ? key.replace(/([a-z])/, (_, char) => `${char.toUpperCase()}`) : key;
    string = `backTo${capitalizedKey || 'Default'}`;
  });
</script>

{#if $stack.length > 1}
  <p class=" tw_my-4 tw_text-base tw_text-center tw_text-link-dark dark:tw_text-link-light">
    <button
      onclick={preventDefault(() => {
        journey?.pop();
      })}
    >
      {interpolate(string)}
    </button>
  </p>
{/if}
