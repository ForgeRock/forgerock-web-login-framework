<script lang="ts">
  import Spinner from '$components/primitives/spinner/spinner.svelte';
  import { styles } from '$widget/styles.store';
  import { generateStyleString } from '$lib/utilities/style.utilities';

  export let busy = false;
  // export let customCss: { key: string; value: string }[] = [];
  export let onClick = (event: Event) => {};
  export let style: 'outline' | 'primary' | 'secondary' = 'outline';
  export let type: 'button' | 'submit' = null;
  export let width: 'auto' | 'full' | 'half' | 'third' = 'auto';

  const inlineStyles = generateStyleString($styles?.button);
</script>

<button
  class={`style-${style} tw_button-base tw_focusable-element width-${width}`}
  data-test="button-primitive"
  on:click={onClick}
  style={inlineStyles}
  {type}
>
  {#if busy}
    <!-- Render a small spinner during form submission -->
    <Spinner colorClass="white" layoutClasses="tw_h-4 tw_w-4 tw_mr-2" />
  {/if}
  <slot>Submit</slot>
</button>

<style>
  .style-primary {
    @apply tw_button-primary;
  }
  .style-secondary {
    @apply tw_button-secondary;
  }
  .style-outline {
    @apply tw_button-outline;
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
