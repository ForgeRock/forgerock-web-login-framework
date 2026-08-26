// A component's real repo home is experimental/custom/<kind>s/<saveName>/<saveName>.svelte
// — the two directories the framework's Vite plugin watches (see
// core/journey/_utilities/registry/vite-plugin.ts). The sidebar groups by
// `kind`; `saveName` (only set for repo-backed entries) tells the local save
// endpoint which of those two directories to write into.
export type CustomComponentKind = 'callback' | 'stage';

export interface CustomComponentEntry {
  name: string;
  kind: CustomComponentKind;
  source: string;
  // JS object-literal source (not strict JSON) — lets mock props carry
  // functions for components that expect SDK-shaped objects (see the
  // custom-name.svelte entry below, which needs callback.getType() etc).
  mockProps: string;
  // Only repo-backed entries can be saved — this is the folder name under
  // experimental/custom/<kind>s/ the local save endpoint writes to. Absent
  // for mock-only entries with no real file.
  saveName?: string;
}

export const customComponents: CustomComponentEntry[] = [
  {
    // Real repo file, verbatim: experimental/custom/demo/callbacks/custom-name/custom-name.svelte
    // Svelte 4 legacy syntax + framework-internal imports ($login-framework,
    // @forgerock/journey-client/types) — kept as-is to demonstrate what an
    // actual authored callback override looks like against the standalone
    // compiler path, not a hand-picked easy case.
    name: 'custom-name.svelte (repo, unmodified)',
    kind: 'callback',
    saveName: 'custom-name',
    source: `<!--
  @component
  Type: callback
  Name: NameCallback

  DEMO COMPONENT
  ──────────────
  Copy this file into experimental/custom/callbacks/<your-name>/ to create your
  own callback override or extension, then rebuild with \`pnpm build:widget\`.

  HOW OVERRIDES WORK
  ──────────────────
  Setting \`Name: NameCallback\` makes this component replace the built-in
  NameCallback renderer everywhere in the journey. The framework's Vite plugin
  writes custom-registry.ts on every build (and watches in dev), mapping:

    "NameCallback" → this component

  callback-mapper.svelte checks that registry first, so this component renders
  instead of the core NameCallback input for every step that contains one.
-->

<script lang="ts">
  // ─── SDK types ─────────────────────────────────────────────────────────────
  // ─── Framework imports ──────────────────────────────────────────────────────
  /**
   * Import everything you need from '$login-framework' — the framework's centralized
   * exports for custom components. No need to reach into internal aliases like
   * $core, $components, or $journey directly.
   *
   * Available exports (see experimental/custom/login-framework.ts for the full list):
   */
  import { interpolate, Stacked, textToKey } from '$login-framework';

  import type { NameCallback } from '@forgerock/journey-client/types';

  import type { CallbackMetadata, Maybe } from '$login-framework';

  // ─── Prop contract ──────────────────────────────────────────────────────────
  export let callback: NameCallback;
  export let callbackMetadata: Maybe<CallbackMetadata>;

  // ─── Local reactive state ──────────────────────────────────────────────────
  let callbackType: string; // AM callback type string, e.g. "NameCallback"
  let inputName: string; // DOM id/name for the <input> element
  let textInputLabel: string; // human-readable label shown above the input
  let value: unknown; // current input value read from the SDK callback

  // ─── Event handler ──────────────────────────────────────────────────────────
  function setValue(event: Event) {
    callback.setInputValue((event.target as HTMLInputElement).value);
  }

  // ─── Reactive block ─────────────────────────────────────────────────────────
  $: {
    callbackType = callback.getType();
    inputName = callback?.payload?.input?.[0].name || \`name-\${callbackMetadata?.idx}\`;
    textInputLabel = callback.getPrompt();
    value = callback?.getInputValue();
  }
</script>

{#key callback}
  <div class="tw_gap-1">
    <!--
      .name-input — wraps the Stacked input to apply the scoped CSS rule below.
      Replace this wrapper (and the style rule) with your own class, or remove
      it entirely if no extra wrapper is needed.
    -->
    <div class="name-input">
      <Stacked
        isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
        key={inputName}
        label={interpolate(textToKey(textInputLabel || callbackType), null, textInputLabel)}
        onChange={setValue}
        type="text"
        showMessage={false}
        value={typeof value === 'string' ? value : ''}
      />
    </div>
    <p class="tw_text-xs tw_text-secondary-dark dark:tw_text-secondary-light tw_px-1">
      {interpolate('customNameHint', null, 'Enter the username for your account.')}
    </p>
  </div>
{/key}

<!--
  Component-scoped styles.

  These styles take final precedence over any theme styles injected by the
  widget's styleStore.
-->
<style>
  /*
   * DEMO: blue background to make the custom component visible at a glance.
   * Replace or remove this in your own implementation — it is only here to
   * make the demo component easy to identify during development.
   */
  .name-input {
    background-color: #027ab8;
    border-radius: 4px;
    padding: 4px;
  }
</style>
`,
    // NameCallback shape from @forgerock/journey-client, mocked by hand —
    // JSON can't carry the getType()/getPrompt()/setInputValue() methods this
    // component actually calls.
    mockProps: `{
  callback: {
    getType: () => 'NameCallback',
    getPrompt: () => 'Username',
    getInputValue: () => '',
    setInputValue: (v) => console.log('setInputValue', v),
    payload: { input: [{ name: 'IDToken1' }] },
  },
  callbackMetadata: { idx: 0, derived: { isFirstInvalidInput: false } },
}`,
  },
  {
    // Real repo file, verbatim: experimental/custom/demo/stages/custom-login/custom-login.svelte
    // Imports Alert/Button/Form/CallbackMapper/styleStore/convertStringToKey/T/
    // captureLinks from $login-framework — the mock module only exports
    // Stacked/interpolate/textToKey, so live preview will fail on unresolved
    // imports until login-framework-mock.ts's export surface is extended.
    name: 'custom-login.svelte (repo, unmodified)',
    kind: 'stage',
    saveName: 'custom-login',
    source: `<!--
  @component
  Type: stage
  Name: DefaultLogin

  DEMO COMPONENT
  ──────────────
  Copy this file into experimental/custom/stages/<your-name>/ to create your
  own stage override or extension, then rebuild with \`pnpm build:widget\`.

  HOW OVERRIDES WORK
  ──────────────────
  Setting \`Name: DefaultLogin\` makes this component replace the built-in
  DefaultLogin stage renderer. The framework's Vite plugin writes
  custom-registry.ts on every build (and watches in dev), mapping:

    "DefaultLogin" → this component

  map-stage.utilities.ts checks that registry before the built-in switch, so
  this component takes over the full form layout for every step whose AM stage
  name is "DefaultLogin".

  HOW EXTENSIONS WORK
  ───────────────────
  Set \`Name:\` to a stage name that does not exist in the built-in set
  (e.g. \`Name: MyBrandedLogin\`). The widget renders this component whenever an
  AM step reports that stage name. You control stage names via the AM journey
  editor — any string value configured there is valid.
-->

<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';

  // ─── Framework imports ──────────────────────────────────────────────────────
  /**
   * Import everything you need from '$login-framework' — the framework's centralized
   * exports for custom components. No need to reach into internal aliases like
   * $core, $components, or $journey directly.
   *
   * Available exports (see experimental/custom/login-framework.ts for the full list):
   *   Components : Stacked, Button, Alert, Form, T, CallbackMapper
   *   Utilities  : interpolate, textToKey, convertStringToKey, captureLinks, styleStore
   *   Types      : CallbackMetadata, SelfSubmitFunction, StepMetadata,
   *                StageFormObject, StageJourneyObject, Maybe, StyleObject
   */
  import {
    Alert,
    Button,
    CallbackMapper,
    captureLinks,
    convertStringToKey,
    Form,
    interpolate,
    styleStore,
    T,
  } from '$login-framework';

  import type { JourneyStep } from '@forgerock/journey-client/types';

  import type {
    CallbackMetadata,
    Maybe,
    StageFormObject,
    StageJourneyObject,
    StepMetadata,
    StyleObject,
  } from '$login-framework';

  // ─── Stage props ─────────────────────────────────────────────────────────────
  export let componentStyle: 'app' | 'inline' | 'modal';
  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{ callbacks: CallbackMetadata[]; step: StepMetadata }>;
  export let step: JourneyStep;

  // ─── Style store subscription ────────────────────────────────────────────────
  let currentStyle: StyleObject = get(styleStore);
  const unsubStyle = styleStore.subscribe((v) => (currentStyle = v));
  onDestroy(unsubStyle);

  // ─── Local state ─────────────────────────────────────────────────────────────
  let alertNeedsFocus = false;
  let formMessageKey = '';
  let linkWrapper: HTMLElement;

  // ─── Helper functions ────────────────────────────────────────────────────────
  function determineSubmission() {
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }

  // ─── Lifecycle hooks ─────────────────────────────────────────────────────────
  afterUpdate(() => {
    alertNeedsFocus = !!form?.message;
  });

  /**
   * onMount — fires once after the component is first inserted into the DOM.
   * captureLinks() attaches a click listener to linkWrapper that intercepts
   * anchor hrefs matching journey routes and navigates via journey.push/pop
   * instead of a full page reload. This is only relevant in modal mode where
   * normal navigation would close the dialog.
   */
  onMount(() => {
    if (componentStyle === 'modal') {
      captureLinks(linkWrapper, journey);
    }
  });

  // ─── Reactive block ──────────────────────────────────────────────────────────
  $: {
    formMessageKey = convertStringToKey(form?.message);
  }
</script>

<!--
  Form — the framework's form wrapper.
-->
<Form bind:formEl ariaDescribedBy="customFormFailureMessageAlert" onSubmitWhenValid={form?.submit}>
  <!--
    Custom branded header

    Customize this section with your own logo, headline, and subtitle copy.
  -->
  {#if componentStyle !== 'inline'}
    <div class="header-container">
      <!--
        Logo / icon placeholder.
        Replace this <div> with your own logo, e.g.:
          <img src="/your-logo.svg" alt="Acme Corp" class="tw_h-12" />
        Or import and use a Svelte icon component from your design system.
      -->
      <div
        class="tw_w-16 tw_h-16 tw_rounded-full tw_bg-blue-600 tw_flex tw_items-center tw_justify-center"
        aria-hidden="true"
      >
        <span class="tw_text-white tw_text-2xl tw_font-bold select-none">✦</span>
      </div>

      <h1 class="tw_primary-header dark:tw_primary-header_dark">
        <span>Sign In</span>
      </h1>

      <p class="tw_text-sm tw_text-secondary-dark dark:tw_text-secondary-light">
        {interpolate('customLoginSubtitle', null, 'Welcome back — please sign in to continue.')}
      </p>
    </div>
  {/if}

  {#if form?.message}
    <Alert id="customFormFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
    </Alert>
  {/if}

  <!--
    CallbackMapper loop — renders one callback component per callback in the step.
    The #each index (idx) is used to look up per-callback metadata.
  -->
  {#each step?.callbacks as callback, idx}
    <CallbackMapper
      props={{
        callback,
        callbackMetadata: metadata?.callbacks[idx],
        selfSubmitFunction: determineSubmission,
        stepMetadata: metadata?.step && { ...metadata.step },
        style: currentStyle,
      }}
    />
  {/each}

  <!--
    Submit button — conditionally rendered.
  -->
  {#if metadata?.step?.derived.isUserInputOptional || !metadata?.step?.derived.isStepSelfSubmittable()}
    <Button busy={journey?.loading} classes="signin-button" style="primary" type="submit" width="full">
      Sign In
    </Button>
  {/if}

  <!--
    Journey links paragraph — rendered only outside inline mode.
  -->
  {#if componentStyle !== 'inline'}
    <p
      bind:this={linkWrapper}
      class="tw_text-base tw_text-center tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light"
    >
      <T key="dontHaveAnAccount" html={true} />
    </p>
  {/if}
</Form>

<style>
  .header-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .signin-button {
    width: 100px;
    text-align: center;
  }
</style>
`,
    // StageFormObject/StageJourneyObject/JourneyStep shapes mocked by hand —
    // JSON can't carry the submit()/isStepSelfSubmittable() methods this
    // component actually calls.
    mockProps: `{
  componentStyle: 'app',
  form: { message: '', submit: () => console.log('submit') },
  formEl: null,
  journey: { loading: false },
  metadata: {
    callbacks: [],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: { callbacks: [] },
}`,
  },
];
