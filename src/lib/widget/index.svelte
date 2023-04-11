<script context="module" lang="ts">
  import { widgetApiFactory } from './_utilities/api.utilities';
  import { componentApi } from './_utilities/component.utilities';

  import './main.css';

  const api = widgetApiFactory(componentApi());

  export const configuration = api.configuration;
  export const journey = api.journey;
  export const component = componentApi;
  export const request = api.request;
  export const user = api.user;
</script>

<script lang="ts">
  import { onMount, SvelteComponent } from 'svelte';

  import { mount } from './_utilities/component.utilities';
  import Dialog from '$components/compositions/dialog/dialog.svelte';
  import Journey from '$journey/journey.svelte';
  import { styleStore } from '$lib/style.store';

  export let type: 'modal' | 'inline' = 'modal';

  const { journeyStore } = api.getStores();

  // Variables that reference the Svelte component and the DOM elements
  let dialogComp: SvelteComponent;
  let dialogEl: HTMLDialogElement;
  let formEl: HTMLFormElement;

  onMount(() => {
    mount(dialogComp, dialogEl);
  });
</script>

{#if type === 'modal'}
  <div class="fr_widget-root">
    <Dialog
      bind:dialogEl
      bind:this={dialogComp}
      dialogId="sampleDialog"
      withHeader={$styleStore?.sections?.header}
    >
      <!-- Default `displayIcon` to `true` if `style.stages.icon` is `undefined` or `null` -->
      <Journey
        bind:formEl
        componentStyle="modal"
        displayIcon={$styleStore?.stage?.icon ?? !$styleStore?.logo}
        {journeyStore}
      />
    </Dialog>
  </div>
{:else}
  <div class="fr_widget-root">
    <!-- Default `displayIcon` to `true` if `style.stages.icon` is `undefined` or `null` -->
    <Journey
      bind:formEl
      componentStyle="inline"
      displayIcon={$styleStore?.stage?.icon ?? true}
      {journeyStore}
    />
  </div>
{/if}
