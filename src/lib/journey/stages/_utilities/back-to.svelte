<script lang="ts">
  import { interpolate } from '$lib/_utilities/i18n.utilities';

  import type { StageJourneyObject } from '$journey/journey.interfaces';
  import { configuredJourneys } from '$journey/config.store';

  export let journey: StageJourneyObject;

  let stack = journey.stack;
  let string = '';

  function constructString() {
    const currentJourney = $configuredJourneys.find((journey) => {
      return journey.journey === $stack[$stack.length - 2]?.tree;
    });

    const key = currentJourney?.key;
    const capitalizedKey =
      typeof key === 'string' ? key.replace(/([a-z])/, (_, char) => `${char.toUpperCase()}`) : key;
    return `backTo${capitalizedKey || 'Default'}`;
  }

  $: {
    string = constructString();
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
