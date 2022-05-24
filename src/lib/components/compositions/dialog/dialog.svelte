<script lang="ts">
  import XIcon from '../../icons/x-icon.svelte';

  export let dialogEl = null;
</script>

<!-- TODO: Animate modal from bottom -->
<dialog
  bind:this={dialogEl}
  class="tw_h-full md:tw_h-fit tw_max-h-full tw_max-w-full md:tw_max-w-lg tw_m-0 tw_mt-2 md:tw_mx-auto md:tw_my-auto md:tw_w-3/4 tw_p-6 md:tw_p-12 tw_pb-16 tw_rounded lg:tw_w-1/2 sm:tw_w-full tw_shadow-xl tw_w-full"
>
  <div class="tw_w-full tw_-mt-4 tw_relative tw_text-right">
    <button on:click={() => dialogEl.close()}>
      <XIcon classes="tw_inline-block tw_fill-current tw_text-gray">Close Modal</XIcon>
    </button>
  </div>
  <slot />
</dialog>
