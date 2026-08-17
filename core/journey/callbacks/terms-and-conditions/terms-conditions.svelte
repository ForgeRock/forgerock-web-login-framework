<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import T from '$components/_utilities/locale-strings.svelte';
  import Animated from '$components/compositions/checkbox/animated.svelte';
  import Standard from '$components/compositions/checkbox/standard.svelte';
  import Link from '$components/primitives/link/link.svelte';
  import { interpolate } from '$core/_utilities/i18n.utilities';
  import { linksStore } from '$core/links.store';

  import type { TermsAndConditionsCallback } from '@forgerock/journey-client/types';
  import type { z } from 'zod';

  import type { Maybe } from '$core/interfaces';
  import type { styleSchema } from '$core/style.store';
  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';

  // Unused props. Setting to const` prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;

  interface Props {
    style?: z.infer<typeof styleSchema>;
    callback: TermsAndConditionsCallback;
    callbackMetadata: Maybe<CallbackMetadata>;
  }

  let { style = {}, callback, callbackMetadata }: Props = $props();

  const Checkbox = style.checksAndRadios === 'standard' ? Standard : Animated;

  let inputName: string = $derived(callback?.payload?.input?.[0].name || `terms-${callbackMetadata?.idx}`);

  /**
   * @function setValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setValue(event: Event) {
    callback.setAccepted((event.target as HTMLInputElement).checked);
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
