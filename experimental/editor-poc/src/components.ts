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
    // Real repo file, verbatim: experimental/custom/stages/hello-world/hello-world.svelte
    // First editor example: only Hello World! renders; the rest is a progressive tutorial.
    name: 'hello-world.svelte',
    kind: 'stage',
    saveName: 'hello-world',
    source: `<!--
@component
Type: stage
Name: HelloWorld
-->

<script lang="ts">
  import { Form } from '$login-framework';

  import type { StageFormObject, StageJourneyObject } from '$login-framework';

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
</script>

<Form bind:formEl onSubmitWhenValid={form?.submit}>
  <span style="color: #334155"> Hello World! </span>
  <button class="tutorial-next" disabled={journey?.loading} type="submit">Next</button>
</Form>

<style>
  .tutorial-next {
    background-color: #3b6073;
    border: 1px solid #027ab8;
    border-radius: 0.25rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
    text-align: center;
    width: 100%;
  }

  .tutorial-next:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
`,
    mockProps: `{
  form: { icon: false, message: '', status: '', submit: () => console.log('submit') },
  formEl: null,
  journey: { loading: false },
}`,
  },
  {
    // Real repo file, verbatim: experimental/custom/stages/hello-world-native/hello-world-native.svelte
    name: 'hello-world-native.svelte',
    kind: 'stage',
    saveName: 'hello-world-native',
    source: `<!--
@component
Type: stage
Name: HelloWorldNative
-->

<script lang="ts">
  import { Form } from '$login-framework';

  import type { StageFormObject, StageJourneyObject } from '$login-framework';

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;

  let name = '';
  let rememberMe = false;
</script>

<Form bind:formEl onSubmitWhenValid={form?.submit}>
  <div style="color: #334155">
    <h1>Hello World!</h1>

    <label>
      Your name
      <input bind:value={name} type="text" />
    </label>

    <label>
      <input bind:checked={rememberMe} type="checkbox" />
      Remember me
    </label>

    <button class="tutorial-next" disabled={journey?.loading} type="submit">Next</button>
  </div>
</Form>

<style>
  .tutorial-next {
    background-color: #3b6073;
    border: 1px solid #027ab8;
    border-radius: 0.25rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
    text-align: center;
    width: 100%;
  }

  .tutorial-next:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
`,
    mockProps: `{
  form: { icon: false, message: '', status: '', submit: () => console.log('submit') },
  formEl: null,
  journey: { loading: false },
}`,
  },
  {
    // Real repo file, verbatim: experimental/custom/stages/hello-world-callbacks/hello-world-callbacks.svelte
    name: 'hello-world-callbacks.svelte',
    kind: 'stage',
    saveName: 'hello-world-callbacks',
    source: `<!--
@component
Type: stage
Name: HelloWorldCallbacks

DEMO COMPONENT — Step 3: AM callbacks
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { get } from 'svelte/store';

  import { CallbackMapper, Form, styleStore } from '$login-framework';

  import type { JourneyStep } from '@forgerock/journey-client/types';

  import type {
    CallbackMetadata,
    Maybe,
    StageFormObject,
    StageJourneyObject,
    StepMetadata,
    StyleObject,
  } from '$login-framework';

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{ callbacks: CallbackMetadata[]; step: StepMetadata }>;
  export let step: JourneyStep;

  let currentStyle: StyleObject = get(styleStore);
  const unsubStyle = styleStore.subscribe((value) => (currentStyle = value));
  onDestroy(unsubStyle);

  function determineSubmission() {
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }
</script>

<Form bind:formEl onSubmitWhenValid={form?.submit}>
  <h1 class="tutorial-heading">Hello World!</h1>
  <p class="tutorial-description">
    CallbackMapper renders fields supplied by your AM journey step.
  </p>

  {#each step?.callbacks as callback, index}
    <CallbackMapper
      props={{
        callback,
        callbackMetadata: metadata?.callbacks[index],
        selfSubmitFunction: determineSubmission,
        stepMetadata: metadata?.step && { ...metadata.step },
        style: currentStyle,
      }}
    />
  {/each}

  <button class="tutorial-next" disabled={journey?.loading} type="submit">Next</button>
</Form>

<style>
  .tutorial-heading {
    color: #334155;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 2rem;
    font-weight: 300;
    margin-bottom: 1rem;
    text-align: center;
  }

  .tutorial-description {
    color: #374151;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .tutorial-next {
    background-color: #3b6073;
    border: 1px solid #027ab8;
    border-radius: 0.25rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
    text-align: center;
    width: 100%;
  }

  .tutorial-next:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
`,
    mockProps: `{
  form: { icon: false, message: '', status: '', submit: () => console.log('submit') },
  formEl: null,
  journey: { loading: false },
  metadata: {
    callbacks: [{ idx: 0, derived: { isFirstInvalidInput: false } }],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: { callbacks: [{}] },
}`,
  },
  {
    // Real repo file, verbatim: experimental/custom/stages/hello-world-styles/hello-world-styles.svelte
    name: 'hello-world-styles.svelte',
    kind: 'stage',
    saveName: 'hello-world-styles',
    source: `<!--
@component
Type: stage
Name: HelloWorldStyles

DEMO COMPONENT — Step 4: scoped styles
-->

<script lang="ts">
  import { Form } from '$login-framework';

  import type { StageFormObject, StageJourneyObject } from '$login-framework';

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
</script>

<Form bind:formEl onSubmitWhenValid={form?.submit}>
  <section class="tutorial-card">
    <p class="tutorial-step">Step 4: scoped styles</p>
    <h1>Hello World!</h1>
    <p>Component-scoped CSS changes this stage without styling other journey steps.</p>

    <button class="tutorial-next" disabled={journey?.loading} type="submit">Next</button>
  </section>
</Form>

<style>
  .tutorial-card {
    background: #eff6ff;
    border: 1px solid #93c5fd;
    border-radius: 0.75rem;
    color: #1e3a8a;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    padding: 1.5rem;
  }

  .tutorial-step {
    color: #2563eb;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin: 0 0 0.5rem;
    text-transform: uppercase;
  }

  .tutorial-card h1 {
    font-size: 2rem;
    font-weight: 300;
    margin: 0 0 0.75rem;
  }

  :global(.dark) .tutorial-card {
    background: #172554;
    border-color: #1d4ed8;
    color: #dbeafe;
  }

  .tutorial-next {
    background-color: #3b6073;
    border: 1px solid #027ab8;
    border-radius: 0.25rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
    text-align: center;
    width: 100%;
  }

  .tutorial-next:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
`,
    mockProps: `{
  form: { submit: () => console.log('submit') },
  formEl: null,
  journey: { loading: false },
}`,
  },
  {
    // Real repo file, verbatim: experimental/custom/stages/hello-world-actions/hello-world-actions.svelte
    name: 'hello-world-actions.svelte',
    kind: 'stage',
    saveName: 'hello-world-actions',
    source: `<!--
@component
Type: stage
Name: HelloWorldActions

DEMO COMPONENT — Step 5: form and journey actions
-->

<script lang="ts">
  import { afterUpdate, onDestroy } from 'svelte';
  import { get } from 'svelte/store';

  import {
    Alert,
    CallbackMapper,
    convertStringToKey,
    Form,
    interpolate,
    styleStore,
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

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{ callbacks: CallbackMetadata[]; step: StepMetadata }>;
  export let step: JourneyStep;

  let currentStyle: StyleObject = get(styleStore);
  const unsubStyle = styleStore.subscribe((value) => (currentStyle = value));
  onDestroy(unsubStyle);

  let alertNeedsFocus = false;
  let formMessageKey = '';

  function determineSubmission() {
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }

  async function restartCurrentJourney() {
    await journey.restartCurrent();
  }

  afterUpdate(() => {
    alertNeedsFocus = Boolean(form?.message);
  });

  $: {
    formMessageKey = convertStringToKey(form?.message);
  }
</script>

<Form bind:formEl ariaDescribedBy="tutorialActionsError" onSubmitWhenValid={form?.submit}>
  <h1 class="tutorial-heading">Hello World!</h1>
  <p class="tutorial-description">
    Submit a form or restart the active journey without hard-coding its name.
  </p>

  {#if form?.message}
    <Alert id="tutorialActionsError" needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
    </Alert>
  {/if}

  {#each step?.callbacks as callback, index}
    <CallbackMapper
      props={{
        callback,
        callbackMetadata: metadata?.callbacks[index],
        selfSubmitFunction: determineSubmission,
        stepMetadata: metadata?.step && { ...metadata.step },
        style: currentStyle,
      }}
    />
  {/each}

  <button class="tutorial-next" disabled={journey?.loading} type="submit">Next</button>
  <button
    class="tutorial-restart"
    disabled={journey?.loading}
    on:click={restartCurrentJourney}
    type="button"
  >
    Start over
  </button>
</Form>

<style>
  .tutorial-heading {
    color: #334155;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 2rem;
    font-weight: 300;
    margin-bottom: 1rem;
    text-align: center;
  }

  .tutorial-description {
    color: #374151;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .tutorial-restart {
    background: none;
    border: 0;
    color: #2563eb;
    cursor: pointer;
    display: block;
    font: inherit;
    margin: 1rem auto;
    padding: 0;
    text-decoration: underline;
  }

  .tutorial-restart:focus-visible {
    outline: 2px solid #027ab8;
    outline-offset: 2px;
  }

  .tutorial-restart:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  .tutorial-next {
    background-color: #3b6073;
    border: 1px solid #027ab8;
    border-radius: 0.25rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
    text-align: center;
    width: 100%;
  }

  .tutorial-next:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
`,
    mockProps: `{
  form: { message: '', submit: () => console.log('submit') },
  formEl: null,
  journey: { loading: false, restartCurrent: async () => console.log('restart current journey') },
  metadata: {
    callbacks: [{ idx: 0, derived: { isFirstInvalidInput: false } }],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: { callbacks: [{}] },
}`,
  },
  {
    // Real repo file, verbatim: experimental/custom/demo/callbacks/custom-name/custom-name.svelte
    // Svelte 4 legacy syntax + framework-internal imports ($login-framework,
    // @forgerock/journey-client/types) — kept as-is to demonstrate what an
    // actual authored callback override looks like against the standalone
    // compiler path, not a hand-picked easy case.
    name: 'custom-name.svelte',
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
    name: 'custom-login.svelte',
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
  import { afterUpdate, onDestroy } from 'svelte';
  import { get } from 'svelte/store';

  import {
    Alert,
    CallbackMapper,
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

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{ callbacks: CallbackMetadata[]; step: StepMetadata }>;
  export let step: JourneyStep;

  let currentStyle: StyleObject = get(styleStore);
  const unsubStyle = styleStore.subscribe((value) => (currentStyle = value));
  onDestroy(unsubStyle);

  let alertNeedsFocus = false;
  let formMessageKey = '';

  function determineSubmission() {
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }

  afterUpdate(() => {
    alertNeedsFocus = Boolean(form?.message);
  });

  $: {
    formMessageKey = convertStringToKey(form?.message);
  }
</script>

<Form bind:formEl ariaDescribedBy="customFormFailureMessageAlert" onSubmitWhenValid={form?.submit}>
  <div class="header-container">
    <div class="custom-login-icon" aria-hidden="true">
      <span class="custom-login-icon-symbol">✦</span>
    </div>

    <h1 class="custom-login-heading">
      <span class="custom-login-heading-text">Sign In</span>
    </h1>

    <p class="custom-login-subtitle">
      {interpolate('customLoginSubtitle', null, 'Welcome back, please sign in to continue.')}
    </p>
  </div>

  {#if form?.message}
    <Alert id="customFormFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
    </Alert>
  {/if}

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

  {#if metadata?.step?.derived.isUserInputOptional || !metadata?.step?.derived.isStepSelfSubmittable()}
    <button class="signin-button" disabled={journey?.loading} type="submit">
      {journey?.loading ? 'Signing in…' : 'Sign In'}
    </button>
  {/if}

  <p class="custom-login-footer">
    No account? <a href="?journey=Registration">Register here!</a>
  </p>
</Form>

<style>
  .header-container {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .custom-login-icon {
    align-items: center;
    background-color: #2563eb;
    border-radius: 9999px;
    display: flex;
    height: 4rem;
    justify-content: center;
    width: 4rem;
  }

  .custom-login-icon-symbol {
    color: #fff;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
    user-select: none;
  }

  .custom-login-heading {
    color: #334155;
    font-size: var(--font-size, 1.5rem);
    font-weight: 300;
    margin: 0 0 1rem;
    text-align: center;
  }

  .custom-login-heading-text {
    display: block;
  }

  .custom-login-subtitle {
    color: var(--color, hsl(210 15% 44%));
    font-size: 0.875rem;
    margin: 0;
    text-align: center;
  }

  .custom-login-footer {
    color: var(--color, hsl(210 15% 44%));
    font-size: 1rem;
    margin: 0;
    padding-bottom: 1rem;
    padding-top: 1rem;
    text-align: center;
  }

  .signin-button {
    background-color: #027ab8;
    border: 1px solid #027ab8;
    border-radius: 0.25rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1.5;
    padding: 0.75rem 1.5rem;
    text-align: center;
    width: 100%;
  }

  .signin-button:hover:not(:disabled),
  .signin-button:focus-visible:not(:disabled) {
    background-color: #01699f;
    border-color: #01699f;
  }

  .signin-button:focus-visible {
    outline: 2px solid #027ab8;
    outline-offset: 2px;
  }

  .signin-button:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
`,
    // StageFormObject/StageJourneyObject/JourneyStep shapes mocked by hand —
    // JSON can't carry the submit()/isStepSelfSubmittable() methods this
    // component actually calls.
    mockProps: `{
  form: { message: '', submit: () => console.log('submit') },
  formEl: null,
  journey: { loading: false },
  metadata: {
    callbacks: [],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: { callbacks: [{}] },
}`,
  },
  {
    // Real repo file, verbatim: experimental/custom/stages/login-validation/login-validation.svelte
    // Demonstrates custom client-side behavioral validation (a 6-digit
    // confirmation code field validated on blur).
    name: 'login-validation.svelte',
    kind: 'stage',
    saveName: 'login-validation',
    source: `<!--
  @component
  Type: stage
  Name: LoginValidation

  DEMO COMPONENT — behavioral field validation
  ─────────────────────────────────────────────
  Extension stage (Name has no built-in AM equivalent). Demonstrates adding
  custom client-side validation behavior on top of the standard login form:
  an extra "Confirmation code" field that must be exactly 6 digits, validated
  on blur, with an inline error message and a red border when invalid.
-->

<script lang="ts">
  import { afterUpdate, onDestroy } from 'svelte';
  import { get } from 'svelte/store';

  import {
    Alert,
    CallbackMapper,
    convertStringToKey,
    Form,
    interpolate,
    styleStore,
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

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{ callbacks: CallbackMetadata[]; step: StepMetadata }>;
  export let step: JourneyStep;

  let currentStyle: StyleObject = get(styleStore);
  const unsubStyle = styleStore.subscribe((value) => (currentStyle = value));
  onDestroy(unsubStyle);

  let alertNeedsFocus = false;
  let formMessageKey = '';

  // Local-only demo field — not part of the SDK callback chain, purely to
  // showcase custom validation behavior in the editor demo.
  let confirmationCode = '';
  let confirmationCodeTouched = false;
  let confirmationCodeError = '';

  function validateConfirmationCode() {
    confirmationCodeTouched = true;
    confirmationCodeError = /^\\d{6}$/.test(confirmationCode)
      ? ''
      : 'Enter exactly 6 digits.';
  }

  function determineSubmission() {
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }

  afterUpdate(() => {
    alertNeedsFocus = Boolean(form?.message);
  });

  $: {
    formMessageKey = convertStringToKey(form?.message);
  }
</script>

<Form bind:formEl ariaDescribedBy="validationFormFailureMessageAlert" onSubmitWhenValid={form?.submit}>
  <h1 class="validation-heading">Sign In</h1>

  {#if form?.message}
    <Alert id="validationFormFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
    </Alert>
  {/if}

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

  <label class="confirmation-field" class:has-error={confirmationCodeTouched && confirmationCodeError}>
    <span>Confirmation code</span>
    <input
      bind:value={confirmationCode}
      inputmode="numeric"
      maxlength="6"
      on:blur={validateConfirmationCode}
      placeholder="123456"
      type="text"
    />
    {#if confirmationCodeTouched && confirmationCodeError}
      <span class="confirmation-error">{confirmationCodeError}</span>
    {/if}
  </label>

  <button class="signin-button" disabled={journey?.loading} type="submit">
    {journey?.loading ? 'Signing in…' : 'Sign In'}
  </button>
</Form>

<style>
  .validation-heading {
    color: #334155;
    font-size: 1.5rem;
    font-weight: 300;
    margin: 0 0 1rem;
    text-align: center;
  }

  .confirmation-field {
    display: flex;
    flex-direction: column;
    font-size: 0.875rem;
    gap: 0.25rem;
    margin-bottom: 1rem;
  }

  .confirmation-field input {
    border: 1px solid #cbd5e1;
    border-radius: 0.25rem;
    color: #334155;
    padding: 0.5rem 0.75rem;
  }

  .confirmation-field.has-error input {
    border-color: #dc2626;
  }

  .confirmation-error {
    color: #dc2626;
    font-size: 0.75rem;
  }

  .signin-button {
    background-color: #027ab8;
    border: 1px solid #027ab8;
    border-radius: 0.25rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
    text-align: center;
    width: 100%;
  }

  .signin-button:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
`,
    mockProps: `{
  form: { message: '', submit: () => console.log('submit') },
  formEl: null,
  journey: { loading: false },
  metadata: {
    callbacks: [],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: { callbacks: [{}] },
}`,
  },
  {
    // Real repo file, verbatim: experimental/custom/stages/login-two-column/login-two-column.svelte
    // Demonstrates rearranging the form into a CSS-grid two-column layout.
    name: 'login-two-column.svelte',
    kind: 'stage',
    saveName: 'login-two-column',
    source: `<!--
  @component
  Type: stage
  Name: LoginTwoColumn

  DEMO COMPONENT — two-column HTML layout
  ─────────────────────────────────────────
  Extension stage (Name has no built-in AM equivalent). Demonstrates
  rearranging the form into a CSS-grid two-column layout: a left column with
  a brand/marketing panel, a right column with the actual login fields.
-->

<script lang="ts">
  import { afterUpdate, onDestroy } from 'svelte';
  import { get } from 'svelte/store';

  import {
    Alert,
    CallbackMapper,
    convertStringToKey,
    Form,
    interpolate,
    styleStore,
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

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{ callbacks: CallbackMetadata[]; step: StepMetadata }>;
  export let step: JourneyStep;

  let currentStyle: StyleObject = get(styleStore);
  const unsubStyle = styleStore.subscribe((value) => (currentStyle = value));
  onDestroy(unsubStyle);

  let alertNeedsFocus = false;
  let formMessageKey = '';

  function determineSubmission() {
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }

  afterUpdate(() => {
    alertNeedsFocus = Boolean(form?.message);
  });

  $: {
    formMessageKey = convertStringToKey(form?.message);
  }
</script>

<div class="two-column-layout">
  <div class="brand-panel">
    <h2>Welcome back</h2>
    <p>Sign in to pick up right where you left off.</p>
  </div>

  <div class="form-panel">
    <Form bind:formEl ariaDescribedBy="twoColumnFormFailureMessageAlert" onSubmitWhenValid={form?.submit}>
      <h1 class="form-heading">Sign In</h1>

      {#if form?.message}
        <Alert id="twoColumnFormFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
          {interpolate(formMessageKey, null, form?.message)}
        </Alert>
      {/if}

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

      <button class="signin-button" disabled={journey?.loading} type="submit">
        {journey?.loading ? 'Signing in…' : 'Sign In'}
      </button>
    </Form>
  </div>
</div>

<style>
  .two-column-layout {
    display: grid;
    gap: 2rem;
    grid-template-columns: 1fr 1fr;
  }

  .brand-panel {
    align-items: center;
    background-color: #eff6ff;
    border-radius: 0.5rem;
    color: #1e3a8a;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 2rem;
    text-align: center;
  }

  .form-panel {
    display: flex;
    flex-direction: column;
  }

  .form-heading {
    color: #334155;
    font-size: 1.5rem;
    font-weight: 300;
    margin: 0 0 1rem;
  }

  .signin-button {
    background-color: #027ab8;
    border: 1px solid #027ab8;
    border-radius: 0.25rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
    text-align: center;
    width: 100%;
  }

  .signin-button:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
`,
    mockProps: `{
  form: { message: '', submit: () => console.log('submit') },
  formEl: null,
  journey: { loading: false },
  metadata: {
    callbacks: [],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: { callbacks: [{}] },
}`,
  },
  {
    // Real repo file, verbatim: experimental/custom/stages/login-continue/login-continue.svelte
    // Demonstrates the smallest possible edit — a displayed-text change from
    // "Sign In" to "Continue" on the submit button.
    name: 'login-continue.svelte',
    kind: 'stage',
    saveName: 'login-continue',
    source: `<!--
  @component
  Type: stage
  Name: LoginContinue

  DEMO COMPONENT — displayed-text change
  ─────────────────────────────────────────
  Extension stage (Name has no built-in AM equivalent). Identical to the
  base custom-login stage, but with the submit button relabeled "Continue"
  instead of "Sign In" — the smallest possible edit to show live-preview
  text changes in the editor.
-->

<script lang="ts">
  import { afterUpdate, onDestroy } from 'svelte';
  import { get } from 'svelte/store';

  import {
    Alert,
    CallbackMapper,
    convertStringToKey,
    Form,
    interpolate,
    styleStore,
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

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{ callbacks: CallbackMetadata[]; step: StepMetadata }>;
  export let step: JourneyStep;

  let currentStyle: StyleObject = get(styleStore);
  const unsubStyle = styleStore.subscribe((value) => (currentStyle = value));
  onDestroy(unsubStyle);

  let alertNeedsFocus = false;
  let formMessageKey = '';

  function determineSubmission() {
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }

  afterUpdate(() => {
    alertNeedsFocus = Boolean(form?.message);
  });

  $: {
    formMessageKey = convertStringToKey(form?.message);
  }
</script>

<Form bind:formEl ariaDescribedBy="continueFormFailureMessageAlert" onSubmitWhenValid={form?.submit}>
  <h1 class="continue-heading">Sign In</h1>

  {#if form?.message}
    <Alert id="continueFormFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
    </Alert>
  {/if}

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

  <button class="continue-button" disabled={journey?.loading} type="submit">
    {journey?.loading ? 'Continuing…' : 'Continue'}
  </button>
</Form>

<style>
  .continue-heading {
    color: #334155;
    font-size: 1.5rem;
    font-weight: 300;
    margin: 0 0 1rem;
    text-align: center;
  }

  .continue-button {
    background-color: #027ab8;
    border: 1px solid #027ab8;
    border-radius: 0.25rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
    text-align: center;
    width: 100%;
  }

  .continue-button:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
`,
    mockProps: `{
  form: { message: '', submit: () => console.log('submit') },
  formEl: null,
  journey: { loading: false },
  metadata: {
    callbacks: [],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: { callbacks: [{}] },
}`,
  },
  {
    // Real repo file, verbatim: experimental/custom/stages/login-scoped-style/login-scoped-style.svelte
    // Demonstrates a component's scoped <style> block winning over the
    // widget's injected theme (styleStore).
    name: 'login-scoped-style.svelte',
    kind: 'stage',
    saveName: 'login-scoped-style',
    source: `<!--
  @component
  Type: stage
  Name: LoginScopedStyle

  DEMO COMPONENT — scoped theme-style override
  ───────────────────────────────────────────────
  Extension stage (Name has no built-in AM equivalent). Demonstrates that a
  component's own <style> block wins over the widget's theme (styleStore) —
  the submit button uses a hardcoded gradient/brand look that a tenant's
  theme colors cannot override, since scoped styles take final precedence.
-->

<script lang="ts">
  import { afterUpdate, onDestroy } from 'svelte';
  import { get } from 'svelte/store';

  import {
    Alert,
    CallbackMapper,
    convertStringToKey,
    Form,
    interpolate,
    styleStore,
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

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{ callbacks: CallbackMetadata[]; step: StepMetadata }>;
  export let step: JourneyStep;

  let currentStyle: StyleObject = get(styleStore);
  const unsubStyle = styleStore.subscribe((value) => (currentStyle = value));
  onDestroy(unsubStyle);

  let alertNeedsFocus = false;
  let formMessageKey = '';

  function determineSubmission() {
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }

  afterUpdate(() => {
    alertNeedsFocus = Boolean(form?.message);
  });

  $: {
    formMessageKey = convertStringToKey(form?.message);
  }
</script>

<Form bind:formEl ariaDescribedBy="scopedStyleFormFailureMessageAlert" onSubmitWhenValid={form?.submit}>
  <h1 class="scoped-style-heading">Sign In</h1>

  {#if form?.message}
    <Alert id="scopedStyleFormFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
    </Alert>
  {/if}

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
    Scoped styles below always win over the theme injected via styleStore —
    this button ignores currentStyle entirely and uses its own gradient.
  -->
  <button class="brand-gradient-button" disabled={journey?.loading} type="submit">
    {journey?.loading ? 'Signing in…' : 'Sign In'}
  </button>
</Form>

<style>
  .scoped-style-heading {
    color: #334155;
    font-size: 1.5rem;
    font-weight: 300;
    margin: 0 0 1rem;
    text-align: center;
  }

  .brand-gradient-button {
    background: linear-gradient(90deg, #7c3aed, #db2777);
    border: none;
    border-radius: 0.5rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    text-align: center;
    width: 100%;
  }

  .brand-gradient-button:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
</style>
`,
    mockProps: `{
  form: { message: '', submit: () => console.log('submit') },
  formEl: null,
  journey: { loading: false },
  metadata: {
    callbacks: [],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: { callbacks: [{}] },
}`,
  },
  {
    // Real repo file, verbatim: experimental/custom/stages/otp-mfa-start-over/otp-mfa-start-over.svelte
    // Demonstrates a callback-driven OTP MFA stage with dynamic Start over behavior.
    name: 'otp-mfa-start-over.svelte',
    kind: 'stage',
    saveName: 'otp-mfa-start-over',
    source: `<!--
  @component
  Type: stage
  Name: OtpMfaStartOver

  DEMO COMPONENT — OTP MFA with restart
  ──────────────────────────────────────
  Extension stage for an OTP MFA journey. It renders AM callbacks through
  CallbackMapper and restarts the active journey without hard-coding its name.
-->

<script lang="ts">
  import { afterUpdate, onDestroy } from 'svelte';
  import { get } from 'svelte/store';

  import {
    Alert,
    CallbackMapper,
    convertStringToKey,
    Form,
    interpolate,
    styleStore,
  } from '$login-framework';

  import type {
    BaseCallback,
    ConfirmationCallback,
    JourneyStep,
  } from '@forgerock/journey-client/types';

  import type {
    CallbackMetadata,
    Maybe,
    StageFormObject,
    StageJourneyObject,
    StepMetadata,
    StyleObject,
  } from '$login-framework';

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{ callbacks: CallbackMetadata[]; step: StepMetadata }>;
  export let step: JourneyStep;

  let currentStyle: StyleObject = get(styleStore);
  const unsubStyle = styleStore.subscribe((value) => (currentStyle = value));
  onDestroy(unsubStyle);

  let alertNeedsFocus = false;
  let buttons: { value: string; text: string }[] = [];
  let formMessageKey = '';
  let modifiedCallbacks: { callback: BaseCallback; originalIndex: number }[] = [];

  function determineSubmission() {
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }

  async function restartCurrentJourney() {
    await journey.restartCurrent();
  }

  afterUpdate(() => {
    alertNeedsFocus = Boolean(form?.message);
  });

  $: {
    formMessageKey = convertStringToKey(form?.message);

    const confirmationCallback = step?.callbacks.find(
      (callback) => callback.getType() === 'ConfirmationCallback',
    ) as ConfirmationCallback | undefined;
    buttons = confirmationCallback
      ? confirmationCallback
          .getOptions()
          .map((option: string, index: number) => ({ value: \`\${index}\`, text: option }))
      : [];

    modifiedCallbacks = (step?.callbacks ?? [])
      .map((callback, originalIndex) => ({ callback, originalIndex }))
      .filter(({ callback }) => callback.getType() !== 'ConfirmationCallback');
  }
</script>

<Form
  bind:formEl
  ariaDescribedBy="otpMfaStartOverFailureMessageAlert"
  onSubmitWhenValid={form?.submit}
>
  <h1 class="otp-heading">2-Step verification to verify it's you</h1>
  <p class="otp-supporting-text">
    We've sent an 8-digit verification code to your email. Please enter it below. It's valid for 5
    minutes.
  </p>

  {#if form?.message}
    <Alert id="otpMfaStartOverFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
    </Alert>
  {/if}

  {#each modifiedCallbacks as { callback, originalIndex }}
    <CallbackMapper
      props={{
        callback,
        callbackMetadata: metadata?.callbacks[originalIndex],
        selfSubmitFunction: determineSubmission,
        stepMetadata: metadata?.step && { ...metadata.step },
        style: currentStyle,
      }}
    />
  {/each}

  {#if buttons.length}
    <button class="submit-button" disabled={journey?.loading} type="submit">Continue</button>
  {:else if metadata?.step?.derived.isUserInputOptional || !metadata?.step?.derived.isStepSelfSubmittable()}
    <button class="submit-button" disabled={journey?.loading} type="submit">Continue</button>
  {/if}

  <p class="start-over">
    <button
      class="start-over-button"
      disabled={journey?.loading}
      on:click={restartCurrentJourney}
      type="button"
    >
      Start over
    </button>
  </p>
</Form>

<style>
  .otp-heading {
    color: #334155;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 2rem;
    font-weight: 300;
    margin-bottom: 1rem;
    text-align: center;
  }

  .otp-supporting-text {
    color: #374151;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 0.875rem;
    line-height: 1.25;
    margin-bottom: 0.5rem;
    margin-top: -1.25rem;
    padding-bottom: 1rem;
    padding-top: 1rem;
    text-align: center;
  }

  .submit-button {
    background-color: #027ab8;
    border: 1px solid #027ab8;
    border-radius: 0.25rem;
    color: #fff;
    cursor: pointer;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 0.9375rem;
    line-height: 1.5;
    padding: 0.75rem 1.5rem;
    position: relative;
    text-align: center;
    width: 100%;
  }

  .submit-button:hover:not(:disabled),
  .submit-button:focus-visible:not(:disabled) {
    background-color: #01699f;
    border-color: #01699f;
  }

  .submit-button:focus-visible,
  .start-over-button:focus-visible {
    outline: 3px solid rgb(2 122 184 / 10%);
    outline-offset: 2px;
  }

  .submit-button:disabled,
  .start-over-button:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  .start-over {
    margin: 1rem 0;
    text-align: center;
  }

  .start-over-button {
    background: none;
    border: 0;
    color: #2563eb;
    cursor: pointer;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 0.9375rem;
    padding: 0;
    text-decoration: underline;
  }

  .start-over-button:hover:not(:disabled) {
    text-decoration: none;
  }

  :global(.dark) .otp-heading,
  :global(.dark) .otp-supporting-text {
    color: #d1d5db;
  }

  :global(.dark) .start-over-button {
    color: #60a5fa;
  }
</style>
`,
    mockProps: `{
  componentStyle: 'modal',
  form: { icon: true, message: '', submit: () => console.log('submit') },
  formEl: null,
  journey: {
    loading: false,
    restartCurrent: async () => console.log('restart current journey'),
  },
  metadata: {
    callbacks: [{ idx: 0, derived: { isFirstInvalidInput: false } }],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: {
    callbacks: [{ getType: () => 'NameCallback' }],
    getCallbacksOfType: () => [],
  },
}`,
  },
];
