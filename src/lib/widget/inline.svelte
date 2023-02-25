<script context="module" lang="ts">
  import { widgetApiFactory } from './_utilities/api.utilities';

  import './main.css';

  let callMounted: (form: HTMLFormElement) => void;

  const api = widgetApiFactory();

  export const configuration = api.configuration;
  export const form = {
    onMount(fn: (form: HTMLFormElement) => void) {
      callMounted = (form: HTMLFormElement) => fn(form);
    },
  };
  export const journey = api.journey;
  export const request = api.request;
  export const user = api.user;
</script>

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { z } from 'zod';

  import Journey from '$journey/journey.svelte';

  // Import the stores for initialization
  import configure from '$lib/sdk.config';
  import { initialize as initializeJourneys } from '$journey/config.store';
  import { initialize as initializeJourney } from '$journey/journey.store';
  import { initialize as initializeContent } from '$lib/locale.store';
  import { initialize as initializeLinks, partialLinksSchema } from '$lib/links.store';
  import { initialize as initializeOauth } from '$lib/oauth/oauth.store';
  import { initialize as initializeUser } from '$lib/user/user.store';
  import { initialize as initializeStyle } from '$lib/style.store';

  import type { partialConfigSchema } from '$lib/sdk.config';
  import type { journeyConfigSchema } from '$journey/config.store';
  import type { partialStringsSchema } from '$lib/locale.store';
  import type { partialStyleSchema } from '$lib/style.store';

  export let config: z.infer<typeof partialConfigSchema> | undefined = undefined;
  export let content: z.infer<typeof partialStringsSchema> | undefined = undefined;
  export let journeys: z.infer<typeof journeyConfigSchema> | undefined = undefined;
  export let links: z.infer<typeof partialLinksSchema> | undefined = undefined;
  export let style: z.infer<typeof partialStyleSchema> | undefined = undefined;

  const dispatch = createEventDispatcher();

  // A reference to the `form` DOM element
  let formEl: HTMLFormElement;

  if (config) {
    // Set base config to SDK
    // TODO: Move to a shared utility
    configure({
      // Set some basics by default
      ...{
        // TODO: Could this be a default OAuth client provided by Platform UI OOTB?
        clientId: 'WebLoginWidgetClient',
        // TODO: If a realmPath is not provided, should we call the realm endpoint and detect a likely default?
        // https://backstage.forgerock.com/docs/am/7/setup-guide/sec-rest-realm-rest.html#rest-api-list-realm
        realmPath: 'alpha',
        // TODO: Once we move to SSR, this default should be more intelligent
        redirectUri:
          typeof window === 'object' ? window.location.href : 'https://localhost:3000/callback',
        scope: 'openid email',
      },
      // Let user provided config override defaults
      ...config,
      // Force 'legacy' to remove confusion
      ...{ support: 'legacy' },
    });
  }

  /**
   * Initialize the stores and ensure both variables point to the same reference.
   * Variables with _ are the reactive version of the original variable from above.
   */
  const journeyStore = initializeJourney(config);
  const oauthStore = initializeOauth(config);
  const userStore = initializeUser(config)
  api.setStores(journeyStore, oauthStore, userStore);

  initializeContent(content);
  initializeJourneys(journeys);
  initializeLinks(links);
  initializeStyle(style);

  onMount(() => {
    /**
     * Call mounted event for Singleton users
     */
    callMounted && callMounted(formEl);
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
    displayIcon={style?.stage?.icon ?? true}
    journeyStore={journeyStore}
  />
</div>
