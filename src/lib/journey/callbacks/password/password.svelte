<script lang="ts">
  /**
   * TODO: Does PasswordCallback do anything that would need to be accounted for here?
   *
   * This is intentionally separated from ValidatedCreatePasswordCallback as it does
   * allow for easier typing for the callback.
   */
  import type { PasswordCallback } from '@forgerock/javascript-sdk';

  import Base from './base.svelte';

  import type { Maybe } from '$lib/interfaces';

  export let callback: PasswordCallback;
  export let firstInvalidInput: boolean;
  export let idx: number;
  export let labelType: Maybe<'floating' | 'stacked'> = 'floating';

  let inputName = callback?.payload?.input?.[0].name || `password-${idx}`;
</script>

<Base {callback} {firstInvalidInput} {idx} {labelType} key={inputName} />
