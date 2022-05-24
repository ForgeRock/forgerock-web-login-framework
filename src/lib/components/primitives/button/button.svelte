<script lang="ts">
  export let width: 'auto' | 'full' | 'half' = 'auto';
  export let onClick = (event: Event) => {};
  export let style: 'outline' | 'primary' | 'secondary' = 'outline';
  export let type: 'button' | 'submit' = null;
</script>

<button
  class={`style-${style} width-${width} tw_leading-6 tw_text-base tw_py-3 tw_px-6 tw_rounded`}
  data-test="button-primitive"
  on:click={onClick}
  {type}>
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
</style>
