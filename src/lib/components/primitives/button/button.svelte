<script lang="ts">
  import Spinner from "$components/primitives/spinner/spinner.svelte";

  export let busy = false;
  export let onClick = (event: Event) => {};
  export let style: 'outline' | 'primary' | 'secondary' = 'outline';
  export let type: 'button' | 'submit' = null;
  export let width: 'auto' | 'full' | 'half' | 'third' = 'auto';
</script>

<button
  class={`style-${style} width-${width} tw_leading-6 tw_text-base tw_py-3 tw_px-6 tw_rounded`}
  data-test="button-primitive"
  on:click={onClick}
  {type}>
  {#if busy}
    <!-- Render a small spinner during form submission -->
    <Spinner colorClass="white" layoutClasses="tw_h-4 tw_w-4 tw_mr-2" />
  {/if}
  <slot>Submit</slot>
</button>

<style>
  .style-primary {
    @apply tw_bg-blue tw_text-white;
  }
  .style-secondary {
    @apply tw_bg-gray tw_text-white;
  }
  .style-outline {
    @apply tw_border;
  }
  .width-auto {
    @apply tw_w-auto;
  }
  .width-full {
    @apply tw_w-full;
  }
  .width-half {
    @apply tw_w-1/2;
  }
  .width-third {
    @apply tw_w-1/3;
  }
</style>
