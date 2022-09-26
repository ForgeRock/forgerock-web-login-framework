<script lang="ts">
  import T from '$components/_utilities/locale-strings.svelte';
  import XIcon from '../../icons/x-icon.svelte';
  import { style } from '$lib/style.store';

  export let closeCallback: (args: { reason: 'auto' | 'external' | 'user' }) => void;
  export let dialogEl: HTMLDialogElement | null = null;
  export let dialogId: string;
  export let forceOpen = false;
  export let withHeader = false;

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
<dialog
  id={dialogId}
  bind:this={dialogEl}
  class={`tw_dialog-box dark:tw_dialog-box_dark md:tw_dialog-box_medium ${
    forceOpen ? '' : 'tw_dialog-box_animate'
  }`}
  open={forceOpen}
>
  {#if withHeader}
    <div class="tw_dialog-header dark:tw_dialog-header_dark">
      <div
        class="tw_dialog-logo dark:tw_dialog-logo_dark"
        style={`--logo-dark: url("${$style?.logo?.dark}"); --logo-light: url("${
          $style?.logo?.light
        }"); ${$style?.logo?.height ? `height: ${$style?.logo.height}px;` : ''} ${
          $style?.logo?.width ? `width: ${$style?.logo.width}px;` : ''
        }`}
      />
      <button
        class="tw_dialog-x md:tw_dialog-x_medium tw_focusable-element dark:tw_focusable-element_dark"
        on:click={() => closeDialog({ reason: 'user' })}
        aria-controls={dialogId}
      >
        <XIcon
          classes="tw_inline-block tw_fill-current tw_text-secondary-dark dark:tw_text-secondary-light"
          ><T key="closeModal" /></XIcon
        >
      </button>
    </div>
  {:else}
    <div
      class={`tw_pt-10 md:tw_pt-10 tw_text-right ${
        $style?.logo ? 'tw_h-32 md:tw_h-36  tw_pb-6' : ''
      }`}
    >
      <button
        class="tw_dialog-x md:tw_dialog-x_medium tw_focusable-element dark:tw_focusable-element_dark"
        on:click={() => closeDialog({ reason: 'user' })}
        aria-controls={dialogId}
      >
        <XIcon
          classes="tw_inline-block tw_fill-current tw_text-secondary-dark dark:tw_text-secondary-light"
          ><T key="closeModal" /></XIcon
        >
      </button>
      {#if $style?.logo}
        <div
          class="tw_dialog-logo dark:tw_dialog-logo_dark"
          style={`--logo-dark: url("${$style?.logo?.dark}"); --logo-light: url("${$style?.logo?.light}")`}
        />
      {/if}
    </div>
  {/if}
  <div class="tw_dialog-body">
    <slot />
  </div>
</dialog>
