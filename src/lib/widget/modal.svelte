<script context="module" lang="ts">
  import { get } from 'svelte/store';

  import type { z } from 'zod';

  import { widgetApiFactory } from './_utilities/api.utilities';

  // Import store types
  import type { JourneyOptions, Modal } from './interfaces';

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

  // Reference to the closeCallback from the above module context
  let _closeCallback = closeCallback;

  // Variables that reference the Svelte component and the DOM element
  // Variables with `_` reference points to the same variables from the `context="module"`
  let _dialogComp: SvelteComponent;
  let _dialogEl: HTMLDialogElement;
  // The single reference to the `form` DOM element
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
    withHeader= {style?.sections?.header}
  >
    <!--
      `displayIcon` prioritizes the direct configuration with `style.stages.icon`,
      but falls back to the existence of the logo with `style.logo`
    -->
    <Journey
      bind:formEl
      displayIcon={style?.stage?.icon ?? !style?.logo}
      journeyStore={journeyStore}
    />
  </Dialog>
</div>
