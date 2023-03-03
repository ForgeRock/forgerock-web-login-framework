<script context="module" lang="ts">
  import { widgetApiFactory } from './_utilities/_api.utilities';
  import { componentApi } from './_utilities/component.utilities';

  // Import store types
  import type { ComponentApi } from './_utilities/component.utilities';

  import './main.css';

  const api = widgetApiFactory(componentApi());

  export const configuration = api.configuration;
  export const journey = api.journey;
  export const modal = api.modal as ComponentApi;
  export const request = api.request;
  export const user = api.user;

  export type ConfigurationApi = ReturnType<typeof api.configuration>;
  export type JourneyApi = ReturnType<typeof api.journey>;
  export type UserInfoApi = ReturnType<typeof api.user.info>;
  export type UserTokensApi = ReturnType<typeof api.user.tokens>;
</script>

<script lang="ts">
  import { createEventDispatcher, onMount, SvelteComponent } from 'svelte';

  import Dialog from '$components/compositions/dialog/dialog.svelte';
  import Journey from '$journey/journey.svelte';
  import { style } from '$lib/style.store';

  const componentEvents = componentApi();
  const dispatch = createEventDispatcher();
  const { journeyStore } = api.getStores();

  // Variables that reference the Svelte component and the DOM element
  // Variables with `_` reference points to the same variables from the `context="module"`
  let dialogComp: SvelteComponent;
  let dialogEl: HTMLDialogElement;
  // The single reference to the `form` DOM element
  let formEl: HTMLFormElement;

  onMount(() => {
    componentEvents.mount(dialogComp, dialogEl);
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
    bind:dialogEl={dialogEl}
    bind:this={dialogComp}
    closeCallback={componentApi().close}
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
