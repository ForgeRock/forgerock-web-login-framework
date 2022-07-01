<script lang="ts">
  import XIcon from '../../icons/x-icon.svelte';

  export let dialogEl = null;
  export let dialogId;
</script>

<!-- TODO: Animate modal from bottom and fade in -->
<dialog
  id={dialogId}
  bind:this={dialogEl}
  class="tw_dialog-box dark:tw_dialog-box_dark md:tw_dialog-box_medium"
>
  <div class="tw_w-full tw_-mt-4 tw_relative tw_text-right">
    <button
      class="tw_dialog-x tw_focusable-element dark:tw_focusable-element_dark"
      on:click={() => dialogEl.close()}
      aria-controls={dialogId}
    >
      <XIcon
        classes="tw_inline-block tw_fill-current tw_text-secondary-dark dark:tw_text-secondary-light"
        >Close Modal</XIcon
      >
    </button>
  </div>
  <slot />
</dialog>
