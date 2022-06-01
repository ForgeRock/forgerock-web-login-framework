<script lang="ts">
  /**
   * TODO: Does PasswordCallback do anything that would need to be accounted for here?
   * Answer: It does allow for easier typing for the callback.
   */
  import type { PasswordCallback } from '@forgerock/javascript-sdk';

  import Base from './base.svelte';

  export let callback: PasswordCallback;
  export let inputName = '';
</script>

<Base {callback} {inputName} />
