<script context="module" lang="ts">
  import { widgetApiFactory } from './_utilities/api.utilities';

  import './main.css';

  let callMounted: () => void;

  const api = widgetApiFactory();

  export const configuration = api.configuration;
  export const form = {
    onMount(fn: () => void) { callMounted = () => fn(); },
  };
  export const journey = api.journey;
  export const request = api.request;
  export const user = api.user;

  export type ConfigurationApi = ReturnType<typeof api.configuration>;
  export type JourneyApi = ReturnType<typeof api.journey>;
  export type UserInfoApi = ReturnType<typeof api.user.info>;
  export type UserTokensApi = ReturnType<typeof api.user.tokens>;
</script>

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  import Journey from '$journey/journey.svelte';
  import { styleStore } from '$lib/style.store';

  const dispatch = createEventDispatcher();
  const { journeyStore } = api.getStores();

  // A reference to the `form` DOM element
  let formEl: HTMLFormElement;

  onMount(() => {
    /**
     * Call mounted event for Singleton users
     */
    callMounted && callMounted();
    /**
     * Call mounted event for Instance users
     * NOTE: needs to be wrapped in setTimeout. Asked in Svelte Discord
     * if this is an issue or expected.
     */
    setTimeout(() => {
      dispatch('form-mount', formEl);
    }, 0);
  });
</script>

<div class="fr_widget-root">
  <!-- Default `displayIcon` to `true` if `style.stages.icon` is `undefined` or `null` -->
  <Journey
    bind:formEl
    displayIcon={$styleStore?.stage?.icon ?? true}
    journeyStore={journeyStore}
  />
</div>
