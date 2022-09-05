<script lang="ts">
  import T from '$components/_utilities/locale-strings.svelte';
  import XIcon from '../../icons/x-icon.svelte';

  export let closeCallback: (args: { reason: 'auto' | 'external' | 'user' }) => void;
  export let dialogEl: HTMLDialogElement | null = null;
  export let dialogId: string;

  interface CloseOptions {
    reason: 'auto' | 'external' | 'user';
  }

  export function closeDialog(args?: CloseOptions) {
    const { reason } = args || { reason: 'external' };

    function completeClose() {
      dialogEl?.close();
      dialogEl?.classList.remove('tw_dialog-closing');

      // Call dev provided callback function for event hook
      closeCallback && closeCallback({ reason });
    }

    // Create timer in case the CSS is not loaded
    const fallbackTimer = setTimeout(completeClose, 500);

    // If animation starts, then CSS is loaded and timer can be removed
    dialogEl?.addEventListener(
      'animationstart',
      () => {
        // Animation started, so we can rely on CSS, rather than timer
        clearTimeout(fallbackTimer);
      },
      { once: true },
    );

    // Clean up the DOM and complete dialog closing
    dialogEl?.addEventListener('animationend', completeClose, { once: true });
    dialogEl?.classList.add('tw_dialog-closing');
  }
</script>

<!-- Inspired by https://github.com/mvolkmann/svelte-dialog -->
<!-- TODO: Animate modal from bottom and fade in -->
<dialog
  id={dialogId}
  bind:this={dialogEl}
  class={`tw_dialog-box dark:tw_dialog-box_dark md:tw_dialog-box_medium`}
>
  <div class="tw_w-full tw_-mt-4 tw_relative tw_text-right">
    <button
      class="tw_dialog-x tw_focusable-element dark:tw_focusable-element_dark"
      on:click={() => closeDialog({ reason: 'user' })}
      aria-controls={dialogId}
    >
      <XIcon
        classes="tw_inline-block tw_fill-current tw_text-secondary-dark dark:tw_text-secondary-light"
        ><T key="closeModal" /></XIcon
      >
    </button>
  </div>
  <slot />
</dialog>
