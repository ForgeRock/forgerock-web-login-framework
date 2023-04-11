<script lang="ts">
  import type { TermsAndConditionsCallback } from '@forgerock/javascript-sdk';
  import type { z } from 'zod';

  import Animated from '$components/compositions/checkbox/animated.svelte';
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import Link from '$components/primitives/link/link.svelte';
  import { linksStore } from '$lib/links.store';
  import Standard from '$components/compositions/checkbox/standard.svelte';
  import T from '$components/_utilities/locale-strings.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  // Unused props. Setting to const` prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;

  export let style: z.infer<typeof styleSchema> = {};
  export let callback: TermsAndConditionsCallback;
  export let callbackMetadata: Maybe<CallbackMetadata>;

  const Checkbox = style.checksAndRadios === 'standard' ? Standard : Animated;

  let inputName: string;

  /**
   * @function setValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setValue(event: Event) {
    callback.setAccepted((event.target as HTMLInputElement).checked);
  }

  $: {
    inputName = callback?.payload?.input?.[0].name || `terms-${callbackMetadata?.idx}`;
  }
</script>

{#if $linksStore?.termsAndConditions}
  <Link classes="tw_block tw_mb-4" href={$linksStore?.termsAndConditions} target="_blank">
    {interpolate('termsAndConditionsLinkText')}
  </Link>
  <Checkbox
    isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
    key={inputName}
    onChange={setValue}
    value={false}
  >
    <T key="termsAndConditions" />
  </Checkbox>
{:else}
  <p class=" tw_text-error-dark dark:tw_text-error-light tw_input-spacing">
    Error: Configuration is missing <code>termsAndConditions</code> URL.
  </p>
{/if}
