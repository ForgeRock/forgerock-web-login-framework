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

  export type ConfigurationApi = ReturnType<typeof api.configuration>;
  export type JourneyApi = ReturnType<typeof api.journey>;
  export type UserInfoApi = ReturnType<typeof api.user.info>;
  export type UserTokensApi = ReturnType<typeof api.user.tokens>;
</script>

<script lang="ts">
  import { onMount, SvelteComponent } from 'svelte';

  import Dialog from '$components/compositions/dialog/dialog.svelte';
  import Journey from '$journey/journey.svelte';
  import { styleStore } from '$lib/style.store';

  export let type: 'modal' | 'inline' = 'modal';

  const componentEvents = componentApi();
  const { journeyStore } = api.getStores();

  // Variables that reference the Svelte component and the DOM elements
  let dialogComp: SvelteComponent;
  let dialogEl: HTMLDialogElement;
  let formEl: HTMLFormElement;

  onMount(() => {
    componentEvents.mount(dialogComp, dialogEl);
  });
</script>

{#if type === 'modal'}
  <div class="fr_widget-root">
    <Dialog
      bind:dialogEl={dialogEl}
      bind:this={dialogComp}
      dialogId="sampleDialog"
      withHeader= {$styleStore?.sections?.header}
    >
      <!-- Default `displayIcon` to `true` if `style.stages.icon` is `undefined` or `null` -->
      <Journey
        bind:formEl
        displayIcon={$styleStore?.stage?.icon ?? !$styleStore?.logo}
        journeyStore={journeyStore}
      />
    </Dialog>
  </div>
{:else}
  <div class="fr_widget-root">
    <!-- Default `displayIcon` to `true` if `style.stages.icon` is `undefined` or `null` -->
    <Journey
      bind:formEl
      displayIcon={$styleStore?.stage?.icon ?? true}
      journeyStore={journeyStore}
    />
  </div>
{/if}
