<script context="module" lang="ts">
  import { widgetApiFactory } from './_utilities/api.utilities';

  // Import store types
  import type { Modal } from './interfaces';

  import './main.css';

  let dialogComp: SvelteComponent;
  let dialogEl: HTMLDialogElement;
  let callMounted: (dialog: HTMLDialogElement, form: HTMLFormElement) => void;
  let closeCallback: (arg: { reason: 'auto' | 'external' | 'user' }) => void;

  const api = widgetApiFactory({
    close(args?: { reason: 'auto' | 'external' | 'user' }) {
      dialogComp.closeDialog(args);
    },
    onClose(fn: (args: { reason: 'auto' | 'external' | 'user' }) => void) {
      closeCallback = (args) => fn(args);
    },
    onMount(fn: (dialog: HTMLDialogElement, form: HTMLFormElement) => void) {
      callMounted = (dialog, form) => fn(dialog, form);
    },
    open() {
      dialogEl.showModal();
    },
  });

  export const configuration = api.configuration;
  export const journey = api.journey;
  export const modal = api.modal as Modal;
  export const request = api.request;
  export const user = api.user;
</script>

<script lang="ts">
  import { createEventDispatcher, onMount, SvelteComponent } from 'svelte';

  import Dialog from '$components/compositions/dialog/dialog.svelte';
  import Journey from '$journey/journey.svelte';
  import { style } from '$lib/style.store';

  const dispatch = createEventDispatcher();

  // Reference to the closeCallback from the above module context
  let _closeCallback = closeCallback;

  // Variables that reference the Svelte component and the DOM element
  // Variables with `_` reference points to the same variables from the `context="module"`
  let _dialogComp: SvelteComponent;
  let _dialogEl: HTMLDialogElement;
  // The single reference to the `form` DOM element
  let formEl: HTMLFormElement;

  const { journeyStore } = api.getStores();

  onMount(() => {
    dialogComp = _dialogComp;
    dialogEl = _dialogEl;

    /**
     * Call mounted event for Singleton users
     */
    callMounted && callMounted(_dialogEl, formEl);
    /**
     * Call mounted event for Instance users
     * NOTE: needs to be wrapped in setTimeout. Asked in Svelte Discord
     * if this is an issue or expected. Answer: Object instantiation seems
     * to be synchronous, so this doesn't get called without `setTimeout`.
     */
    setTimeout(() => {
      dispatch('modal-mount', 'Modal mounted');
    }, 0);
  });
</script>

<div class="fr_widget-root">
  <Dialog
    bind:dialogEl={_dialogEl}
    bind:this={_dialogComp}
    closeCallback={_closeCallback}
    dialogId="sampleDialog"
    withHeader= {$style?.sections?.header}
  >
    <!--
      `displayIcon` prioritizes the direct configuration with `style.stages.icon`,
      but falls back to the existence of the logo with `style.logo`
    -->
    <Journey
      bind:formEl
      displayIcon={$style?.stage?.icon ?? !$style?.logo}
      journeyStore={journeyStore}
    />
  </Dialog>
</div>
