<script lang="ts">
  import { onMount } from 'svelte';
  import type { ValidatedCreatePasswordCallback } from '@forgerock/javascript-sdk';


  import Input from './validated-create-password.svelte';

  export let callback: ValidatedCreatePasswordCallback;
  export let inputName: string;
  export let showError: boolean;

  let el;

  onMount(() => {
    if (showError) {
      // Only done to force an error without any user interaction
      let root = el.$$.root;
      console.log(root);
      let errorEl = root.querySelector('input');
      errorEl.setAttribute('aria-invalid', true);
    }
  });
</script>

<Input bind:this={el} {callback} {inputName} />
