<script lang="ts">
  import T from '$components/_utilities/locale-strings.svelte';
  import XIcon from '../../icons/x-icon.svelte';
  import { styleStore } from '$lib/style.store';
  import { closeComponent } from '$lib/widget/_utilities/component.utilities';

  import type { ComponentStoreValue } from '$lib/widget/_utilities/component.utilities';

  export let dialogEl: HTMLDialogElement | null = null;
  export let dialogId: string;
  export let forceOpen = false;
  export let withHeader = false;

  // TODO: Add a keyboard listener
  export function closeDialog(reason: ComponentStoreValue['reason']) {
    function completeClose() {
      dialogEl?.close();
      dialogEl?.classList.remove('tw_dialog-closing');

      // Ensure we have a store and it has an update method on it
      closeComponent({ reason });
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
        style={`--logo-dark: url("${$styleStore?.logo?.dark}"); --logo-light: url("${
          $styleStore?.logo?.light
        }"); ${$styleStore?.logo?.height ? `height: ${$styleStore?.logo.height}px;` : ''} ${
          $styleStore?.logo?.width ? `width: ${$styleStore?.logo.width}px;` : ''
        }`}
      />
      <button
        class="tw_dialog-x md:tw_dialog-x_medium tw_focusable-element dark:tw_focusable-element_dark"
        on:click={() => closeDialog('user')}
        aria-controls={dialogId}
        aria-label="Close"
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
        $styleStore?.logo ? 'tw_h-32 md:tw_h-36  tw_pb-6' : ''
      }`}
    >
      <button
        class="tw_dialog-x md:tw_dialog-x_medium tw_focusable-element dark:tw_focusable-element_dark"
        on:click={() => closeDialog('user')}
        aria-controls={dialogId}
      >
        <XIcon
          classes="tw_inline-block tw_fill-current tw_text-secondary-dark dark:tw_text-secondary-light"
          ><T key="closeModal" /></XIcon
        >
      </button>
      {#if $styleStore?.logo}
        <div
          class="tw_dialog-logo dark:tw_dialog-logo_dark"
          style={`--logo-dark: url("${$styleStore?.logo?.dark}"); --logo-light: url("${$styleStore?.logo?.light}")`}
        />
      {/if}
    </div>
  {/if}
  <div class="tw_dialog-body">
    <slot />
  </div>
</dialog>
