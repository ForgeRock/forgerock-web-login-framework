<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script module lang="ts">
  import './main.css';
  import { componentApi } from './_utilities/component.utilities';
  import { widgetApiFactory } from './widget.api';

  const api = widgetApiFactory(componentApi());

  export const configure = api.configure;
  export const journey = api.journey;
  export const component = componentApi;
  export const user = api.user;
  export const protect = api.protect;
</script>

<script lang="ts">
  import { tick } from 'svelte';
  import { run } from 'svelte/legacy';

  import Dialog from '$components/compositions/dialog/dialog.svelte';
  import { applyThemeVars } from '$core/_effects/theme.effects';
  import { styleStore } from '$core/style.store';
  import Journey from '$journey/journey.svelte';
  import { mount } from './_utilities/component.utilities';

  import type { SvelteComponent } from 'svelte';

  interface Props {
    type?: 'modal' | 'inline';
  }

  let { type = 'modal' }: Props = $props();

  const { journeyStore } = api.getStores();

  // Variables that reference the Svelte component and the DOM elements
  let dialogComp: SvelteComponent = $state();
  let dialogEl: HTMLDialogElement = $state();
  let formEl: HTMLFormElement = $state();
  let widgetRootEl: HTMLDivElement = $state();

  run(() => {
    applyThemeVars(widgetRootEl, $styleStore?.theme);
  });

  $effect(() => {
    if (type === 'modal' && dialogComp && dialogEl) {
      tick().then(() => mount(dialogComp, dialogEl));
    } else if (type === 'inline') {
      mount();
    }
  });
</script>

{#if type === 'modal'}
  <div bind:this={widgetRootEl} class="fr_widget-root">
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
  <div bind:this={widgetRootEl} class="fr_widget-root">
    <!-- Default `displayIcon` to `true` if `style.stages.icon` is `undefined` or `null` -->
    <Journey
      bind:formEl
      componentStyle="inline"
      displayIcon={$styleStore?.stage?.icon ?? true}
      {journeyStore}
    />
  </div>
{/if}

<style>
  .fr_widget-root {
    font-family: var(--fr-font-family, 'Open Sans'), ui-sans-serif, system-ui, sans-serif;
  }
</style>
