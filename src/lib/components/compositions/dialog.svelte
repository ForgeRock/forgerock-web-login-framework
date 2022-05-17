<script lang="ts">
  import XIcon from "../icons/x-icon.svelte";
  export let dialog;
</script>

<dialog bind:this={dialog} class="max-w-lg p-12 pb-16 rounded w-1/2 shadow-xl">
  <button class="w-full text-right" on:click={() => dialog.close()}>
    <XIcon classes="inline-block fill-current text-gray" />
  </button>
  <slot />
</dialog>
