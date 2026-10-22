// A component's real repo home is experimental/custom/<kind>s/<saveName>/<saveName>.svelte
// — the two directories the framework's Vite plugin watches (see
// core/journey/_utilities/registry/vite-plugin.ts). The sidebar groups by
// `kind`; `saveName` (only set for repo-backed entries) tells the local save
// endpoint which of those two directories to write into.
import { callbackCatalog, CATALOG_TYPES } from './callback-catalog';

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

// Repo-backed demo components. These mirror real files under
// experimental/custom/{stages,callbacks}/ (via saveName) or are mock-only
// demos with no repo file.
export const repoCustomComponents: CustomComponentEntry[] = [
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
  import { Button, Form } from '$login-framework';

  import type { StageFormObject, StageJourneyObject } from '$login-framework';

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
</script>

<Form bind:formEl onSubmitWhenValid={form?.submit}>
  <span style="color: #334155"> Hello World! </span>
  <Button busy={journey?.loading} style="primary" type="submit" width="full">Next</Button>
</Form>
`,
    mockProps: `{
  form: { icon: false, message: '', status: '', submit: () => console.log('submit') },
  formEl: null,
  journey: createDemoJourney(),
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
  import { Button, Form } from '$login-framework';

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

    <Button busy={journey?.loading} style="primary" type="submit" width="full">Next</Button>
  </div>
</Form>
`,
    mockProps: `{
  form: { icon: false, message: '', status: '', submit: () => console.log('submit') },
  formEl: null,
  journey: createDemoJourney(),
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

  import { Button, CallbackMapper, Form, styleStore } from '$login-framework';

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

  <Button busy={journey?.loading} style="primary" type="submit" width="full">Next</Button>
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
</style>
`,
    mockProps: `{
  form: { icon: false, message: '', status: '', submit: () => console.log('submit') },
  formEl: null,
  journey: createDemoJourney(),
  metadata: {
    callbacks: [{ idx: 0, derived: { isFirstInvalidInput: false } }],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: createDemoStep({
    callbacks: [
      { type: 'NameCallback', output: [{ name: 'prompt', value: 'User Name' }], input: [{ name: 'IDToken1', value: '' }], _id: 0 },
      { type: 'PasswordCallback', output: [{ name: 'prompt', value: 'Password' }], input: [{ name: 'IDToken2', value: '' }], _id: 1 },
    ],
  }),
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
  import { Button, Form } from '$login-framework';

  import type { StageFormObject, StageJourneyObject } from '$login-framework';

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;

  // Local-only demo field — not part of the SDK callback chain, purely to
  // showcase custom validation behavior alongside the scoped-styles demo.
  let confirmationCode = '';
  let confirmationCodeTouched = false;
  let confirmationCodeError = '';

  function validateConfirmationCode() {
    confirmationCodeTouched = true;
    confirmationCodeError = /^\\d{6}$/.test(confirmationCode) ? '' : 'Enter exactly 6 digits.';
  }
</script>

<Form bind:formEl onSubmitWhenValid={form?.submit}>
  <section class="tutorial-card">
    <span class="tutorial-step">Step 4 · Scoped styles</span>
    <h1>Hello World! <span class="tutorial-sparkle" aria-hidden="true">✦</span></h1>
    <p>
      This gradient border, glow, and button are defined entirely in this component's own
      &lt;style&gt; block, isolated from every other step in the journey.
    </p>

    <label
      class="tutorial-field"
      class:has-error={confirmationCodeTouched && confirmationCodeError}
    >
      <span>Confirmation code</span>
      <input
        bind:value={confirmationCode}
        inputmode="numeric"
        maxlength="6"
        on:blur={validateConfirmationCode}
        pattern={'\\\\d{6}'}
        placeholder="123456"
        required
        type="text"
      />
      {#if confirmationCodeTouched && confirmationCodeError}
        <span class="tutorial-field-error">{confirmationCodeError}</span>
      {/if}
    </label>

    <Button busy={journey?.loading} style="primary" type="submit" width="full">Next →</Button>
  </section>
</Form>

<style>
  .tutorial-card {
    background:
      linear-gradient(#eff6ff, #eff6ff) padding-box,
      linear-gradient(135deg, #7c3aed, #2563eb, #db2777) border-box;
    border: 2px solid transparent;
    border-radius: 1rem;
    box-shadow: 0 12px 32px -8px rgb(124 58 237 / 25%);
    color: #1e3a8a;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    padding: 1.75rem;
  }

  .tutorial-step {
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin: 0 0 0.5rem;
    text-transform: uppercase;
  }

  .tutorial-card h1 {
    align-items: center;
    display: flex;
    font-size: 2.25rem;
    font-weight: 300;
    gap: 0.5rem;
    margin: 0 0 0.75rem;
  }

  .tutorial-sparkle {
    animation: sparkle-pulse 2s ease-in-out infinite;
    background: linear-gradient(135deg, #7c3aed, #db2777);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-size: 1.5rem;
  }

  @keyframes sparkle-pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.2) rotate(15deg);
    }
  }

  :global(.dark) .tutorial-card {
    background:
      linear-gradient(#172554, #172554) padding-box,
      linear-gradient(135deg, #7c3aed, #2563eb, #db2777) border-box;
    color: #dbeafe;
  }

  .tutorial-field {
    display: flex;
    flex-direction: column;
    font-size: 0.875rem;
    gap: 0.25rem;
    margin-bottom: 1.25rem;
  }

  .tutorial-field input {
    border: 1px solid #c4b5fd;
    border-radius: 0.5rem;
    color: #1e3a8a;
    padding: 0.5rem 0.75rem;
  }

  .tutorial-field.has-error input {
    border-color: #dc2626;
  }

  .tutorial-field-error {
    color: #dc2626;
    font-size: 0.75rem;
  }

  .tutorial-card :global(button) {
    background: linear-gradient(135deg, #7c3aed, #2563eb, #db2777);
    background-size: 150% 100%;
    background-position: 0% 0%;
    border: none;
    border-radius: 0.5rem;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    text-align: center;
    transition: background-position 0.35s ease, transform 0.15s ease;
    width: 100%;
  }

  .tutorial-card :global(button:hover) {
    background-position: 100% 0%;
    transform: translateY(-1px);
  }
</style>
`,
    mockProps: `{
  form: { submit: () => console.log('submit') },
  formEl: null,
  journey: createDemoJourney(),
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
    Button,
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
    await journey.restart();
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

  <Button busy={journey?.loading} style="primary" type="submit" width="full">Next</Button>
  <div class="tutorial-restart">
    <Button onClick={restartCurrentJourney} style="outline" type="button" width="full">
      Start over
    </Button>
  </div>
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
    margin-top: 1rem;
  }
</style>
`,
    mockProps: `{
  form: { message: '', submit: () => console.log('submit') },
  formEl: null,
  journey: createDemoJourney(),
  metadata: {
    callbacks: [{ idx: 0, derived: { isFirstInvalidInput: false } }],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: createDemoStep({
    callbacks: [
      { type: 'NameCallback', output: [{ name: 'prompt', value: 'User Name' }], input: [{ name: 'IDToken1', value: '' }], _id: 0 },
      { type: 'PasswordCallback', output: [{ name: 'prompt', value: 'Password' }], input: [{ name: 'IDToken2', value: '' }], _id: 1 },
    ],
  }),
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
    // Based on repo file experimental/custom/demo/stages/custom-login/custom-login.svelte;
    // this editor copy renders the submit action with the framework Button.
    // Imports Alert/Button/Form/CallbackMapper/styleStore/convertStringToKey/T/
    // captureLinks from $login-framework — exercises the real framework surface
    // end to end in the preview (IAM-12011).
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
    Button,
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
    <Button busy={journey?.loading} style="primary" type="submit" width="full">
      {journey?.loading ? 'Signing in…' : 'Sign In'}
    </Button>
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
</style>
`,
    // StageFormObject/StageJourneyObject/JourneyStep shapes mocked by hand —
    // JSON can't carry the submit()/isStepSelfSubmittable() methods this
    // component actually calls.
    mockProps: `{
  form: { message: '', submit: () => console.log('submit') },
  formEl: null,
  journey: createDemoJourney(),
  metadata: {
    callbacks: [],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: createDemoStep({
    callbacks: [
      { type: 'NameCallback', output: [{ name: 'prompt', value: 'User Name' }], input: [{ name: 'IDToken1', value: '' }], _id: 0 },
      { type: 'PasswordCallback', output: [{ name: 'prompt', value: 'Password' }], input: [{ name: 'IDToken2', value: '' }], _id: 1 },
    ],
  }),
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
    Button,
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

  <Button busy={journey?.loading} style="primary" type="submit" width="full">
    {journey?.loading ? 'Signing in…' : 'Sign In'}
  </Button>
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
</style>
`,
    mockProps: `{
  form: { message: '', submit: () => console.log('submit') },
  formEl: null,
  journey: createDemoJourney(),
  metadata: {
    callbacks: [],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: createDemoStep({
    callbacks: [
      { type: 'NameCallback', output: [{ name: 'prompt', value: 'User Name' }], input: [{ name: 'IDToken1', value: '' }], _id: 0 },
      { type: 'PasswordCallback', output: [{ name: 'prompt', value: 'Password' }], input: [{ name: 'IDToken2', value: '' }], _id: 1 },
    ],
  }),
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
    Button,
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

      <Button busy={journey?.loading} style="primary" type="submit" width="full">
        {journey?.loading ? 'Signing in…' : 'Sign In'}
      </Button>
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
</style>
`,
    mockProps: `{
  form: { message: '', submit: () => console.log('submit') },
  formEl: null,
  journey: createDemoJourney(),
  metadata: {
    callbacks: [],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: createDemoStep({
    callbacks: [
      { type: 'NameCallback', output: [{ name: 'prompt', value: 'User Name' }], input: [{ name: 'IDToken1', value: '' }], _id: 0 },
      { type: 'PasswordCallback', output: [{ name: 'prompt', value: 'Password' }], input: [{ name: 'IDToken2', value: '' }], _id: 1 },
    ],
  }),
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
    Button,
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

  <Button busy={journey?.loading} style="primary" type="submit" width="full">
    {journey?.loading ? 'Continuing…' : 'Continue'}
  </Button>
</Form>

<style>
  .continue-heading {
    color: #334155;
    font-size: 1.5rem;
    font-weight: 300;
    margin: 0 0 1rem;
    text-align: center;
  }
</style>
`,
    mockProps: `{
  form: { message: '', submit: () => console.log('submit') },
  formEl: null,
  journey: createDemoJourney(),
  metadata: {
    callbacks: [],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: createDemoStep({
    callbacks: [
      { type: 'NameCallback', output: [{ name: 'prompt', value: 'User Name' }], input: [{ name: 'IDToken1', value: '' }], _id: 0 },
      { type: 'PasswordCallback', output: [{ name: 'prompt', value: 'Password' }], input: [{ name: 'IDToken2', value: '' }], _id: 1 },
    ],
  }),
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
    Button,
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
  <div class="brand-gradient-cta">
    <Button busy={journey?.loading} style="primary" type="submit" width="full">
      {journey?.loading ? 'Signing in…' : 'Sign In'}
    </Button>
  </div>
</Form>

<style>
  .scoped-style-heading {
    color: #334155;
    font-size: 1.5rem;
    font-weight: 300;
    margin: 0 0 1rem;
    text-align: center;
  }

  .brand-gradient-cta :global(button) {
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
</style>
`,
    mockProps: `{
  form: { message: '', submit: () => console.log('submit') },
  formEl: null,
  journey: createDemoJourney(),
  metadata: {
    callbacks: [],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: createDemoStep({
    callbacks: [
      { type: 'NameCallback', output: [{ name: 'prompt', value: 'User Name' }], input: [{ name: 'IDToken1', value: '' }], _id: 0 },
      { type: 'PasswordCallback', output: [{ name: 'prompt', value: 'Password' }], input: [{ name: 'IDToken2', value: '' }], _id: 1 },
    ],
  }),
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
    Button,
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
    await journey.restart();
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
    <Button busy={journey?.loading} style="primary" type="submit" width="full">Continue</Button>
  {:else if metadata?.step?.derived.isUserInputOptional || !metadata?.step?.derived.isStepSelfSubmittable()}
    <Button busy={journey?.loading} style="primary" type="submit" width="full">Continue</Button>
  {/if}

  <p class="start-over">
    <Button onClick={restartCurrentJourney} style="outline" type="button" width="full">
      Start over
    </Button>
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

  .start-over {
    margin: 1rem 0;
    text-align: center;
  }

  :global(.dark) .otp-heading,
  :global(.dark) .otp-supporting-text {
    color: #d1d5db;
  }
</style>
`,
    mockProps: `{
  componentStyle: 'modal',
  form: { icon: true, message: '', submit: () => console.log('submit') },
  formEl: null,
  journey: createDemoJourney(),
  metadata: {
    callbacks: [{ idx: 0, derived: { isFirstInvalidInput: false } }],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: createDemoStep({
    callbacks: [
      {
        type: 'NameCallback',
        output: [{ name: 'prompt', value: 'Username' }],
        input: [{ name: 'IDToken1', value: '' }],
        _id: 0,
      },
    ],
  }),
}`,
  },
  {
    // DEMO COMPONENT — mock-only (no repo file): IAM-12011 task 5. Imports
    // all five public `$login-framework` runtime APIs (configure, journey,
    // component, user, protect) and drives the REAL widget runtime over the
    // mocked AM journey client. Self-boots: on mount it awaits configure(),
    // starts the journey, subscribes the component/user stores and starts
    // protect; the Form's submit path drives journeyStore.next() exactly the
    // way journey.svelte's submitForm does, and the mock client answers with
    // LoginSuccess. No mockProps step — the runtime state comes from the
    // stores this component initializes itself.
    name: 'demo-widget-runtime.svelte',
    kind: 'stage',
    source: `<!--
@component
Type: stage
Name: DemoWidgetRuntime

DEMO COMPONENT — IAM-12011 task 5
─────────────────────────────────
Imports ALL FIVE public $login-framework runtime APIs (configure, journey,
component, user, protect) and drives the REAL widget runtime over the mocked
AM journey client:

  1. await configure({ serverConfig }) — real Zod parsing + journey store
     initialization (the mocked journey client answers the start calls;
     nothing reaches a network).
  2. journey({ oauth: false, user: false }).start() — the mock client
     returns a Name/Password step; the real journeyStore publishes it.
  3. Submission through Form onSubmitWhenValid mirrors what journey.svelte's
     submitForm does — journeyStore.next(step) — and the mock client answers
     with LoginSuccess.
  4. component().subscribe — the real componentStore action events.
  5. user.info / protect.start — real store guards (OIDC is not configured
     in the preview, so user.info reports the documented "OIDC client not
     configured" state; protect runs against the stub's no-op client).

NOT a component you would author — it is the editor-preview demo proving the
full public API renders and runs inside the sandbox.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { get } from 'svelte/store';

  import {
    Button,
    CallbackMapper,
    component,
    configure,
    Form,
    getStores,
    journey as journeyApiFactory,
    protect,
    styleStore,
    T,
    user,
  } from '$login-framework';

  import type { StageFormObject, StageJourneyObject } from '$login-framework';

  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;

  let runtimeStatus = 'configuring…';
  let componentEvents: string[] = [];
  let userStatus = 'not queried';
  let protectStatus = 'not started';
  // Snapshot of the real journeyStore value for the markup below — kept as a
  // plain reactive variable (updated by the store subscription in
  // bootRuntime) instead of a $-prefixed auto-subscription, because
  // getStores() is only usable after configure() resolves.
  type JourneyState = {
    metadata: { callbacks: Array<unknown>; step: Record<string, unknown> } | null;
    step: { callbacks: Array<unknown>; type: string } | null;
  } | null;
  let journeyState: JourneyState = null;

  // The stores/APIs throw "missing configuration" until configure() resolves
  // (widget.api.ts guards every accessor), so ALL runtime calls happen inside
  // bootRuntime() after the awaited configure — same ordering rule the
  // published widget documents. Only the component factory is safe early:
  // componentStore is configuration-independent.
  const componentApiInstance = component();
  const unsubComponent = componentApiInstance.subscribe((state) => {
    if (state.lastAction) {
      componentEvents = [...componentEvents.slice(-3), state.lastAction];
    }
  });

  let journeyStoreUnsubscribe: (() => void) | null = null;
  let userUnsubscribe: (() => void) | null = null;
  // Subscriptions created inside the async bootRuntime (after component init,
  // where Svelte forbids onDestroy) collect here; the single onDestroy at
  // component init drains the array on teardown.
  const bootUnsubscribers: Array<() => void> = [];

  // Submit the CURRENT step through the real journey store — the same call
  // journey.svelte's submitForm makes when a stage form is submitted.
  function submitStep(): void {
    if (!journeyStoreUnsubscribe) {
      return;
    }
    const { journeyStore } = getStores();
    const state = get(journeyStore);
    if (state.step && state.step.type === 'Step') {
      void journeyStore.next(state.step);
    }
  }

  async function bootRuntime(): Promise<void> {
    try {
      // configure() runs the real pipeline: serverConfigSchema.parse ->
      // initializeJourney -> mocked journey client construction (no network)
      // -> oauth/user store initialization (OIDC-less).
      await configure({
        serverConfig: {
          wellknown: 'https://mock.example.com/am/oauth2/alpha/.well-known/openid-configuration',
        },
      });

      // Real user store — OIDC is not configured in the preview, so the
      // store's documented "OIDC client not configured" error state is what
      // shows here. user.info() AFTER configure (pre-config it throws).
      const userApi = user.info();
      userUnsubscribe = userApi.subscribe((state) => {
        userStatus = state.error?.message ?? (state.completed ? 'completed' : 'loading');
      });
      void userApi.get();
      // Real protect store over the stub client — start() resolves the no-op.
      void protect.start({ envId: 'editor-preview-env' }).then((result) => {
        protectStatus = result && 'error' in result ? \`error: \${result.error}\` : 'started';
      });

      // Real journey API over the mocked client. oauth/user disabled: the
      // preview has no OIDC client, and the journey promise then resolves on
      // step success alone (widget.api.ts start() !requestsOauth branch).
      const journeyApi = journeyApiFactory({ oauth: false, user: false });
      bootUnsubscribers.push(
        journeyApi.subscribe((state) => {
          runtimeStatus = state.journey.successful
            ? 'success (mock LoginSuccess)'
            : state.journey.step
              ? 'awaiting submission'
              : 'starting…';
        }),
      );

      // Mirror the real journeyStore into the markup-facing journeyState.
      const { journeyStore } = getStores();
      journeyStoreUnsubscribe = journeyStore.subscribe((value) => {
        journeyState = {
          metadata: value.metadata,
          step: value.step as { callbacks: Array<unknown>; type: string },
        };
      });

      // Fire the start; the mock client's start() returns the Name/Password
      // step and the real journeyStore publishes it. The start() promise
      // resolves only when the journey completes (after submission below).
      void journeyApi.start({ journey: 'Login' });

      runtimeStatus = 'configured — awaiting submission';
    } catch (error) {
      runtimeStatus = \`configure failed: \${error instanceof Error ? error.message : String(error)}\`;
    }
  }

  void bootRuntime();

  onDestroy(() => {
    unsubComponent();
    userUnsubscribe?.();
    journeyStoreUnsubscribe?.();
    bootUnsubscribers.forEach((unsubscribe) => unsubscribe());
  });
</script>

<Form bind:formEl onSubmitWhenValid={submitStep}>
  <h2 class="demo-heading">
    <T key="loginHeader">Widget runtime demo</T>
  </h2>

  <ul class="demo-status-list">
    <li><strong>configure:</strong> {runtimeStatus}</li>
    <li>
      <strong>current step:</strong>
      {#if journeyState?.step?.type === 'Step'}
        <div class="demo-step-callbacks">
          {#each journeyState.step.callbacks as callback, index}
            <CallbackMapper
              props={{
                callback,
                callbackMetadata: journeyState.metadata?.callbacks[index],
                selfSubmitFunction: () => undefined,
                stepMetadata: journeyState.metadata?.step && { ...journeyState.metadata.step },
                style: get(styleStore),
              }}
            />
          {/each}
        </div>
      {:else}
        (none yet)
      {/if}
    </li>
    <li><strong>component events:</strong> {componentEvents.join(', ') || '(none)'}</li>
    <li><strong>user.info:</strong> {userStatus}</li>
    <li><strong>protect.start:</strong> {protectStatus}</li>
  </ul>

  <Button busy={journey?.loading} style="primary" type="submit" width="full">
    Submit step (journeyStore.next)
  </Button>
</Form>

<style>
  .demo-heading {
    color: #334155;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 1.5rem;
    font-weight: 300;
    margin-bottom: 1rem;
    text-align: center;
  }

  .demo-status-list {
    color: #374151;
    font-family: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
    font-size: 0.875rem;
    line-height: 1.6;
    margin: 0 0 1.25rem;
    padding-left: 1.25rem;
    text-align: left;
  }

  .demo-step-callbacks {
    display: block;
    margin-top: 0.5rem;
  }
</style>
`,
    mockProps: `{
  form: { icon: false, message: '', status: '', submit: () => console.log('submit') },
  formEl: null,
  journey: createDemoJourney(),
}`,
  },
];

// ─── Callback catalog demos (IAM-12011 task 3) ──────────────────────────────
// One demo per AM callback type. Every demo shares the same stage source —
// the catalog demos exist to exercise the REAL rendering path (payload →
// createJourneyStep → real createCallback factory → CallbackMapper → real
// callback component), not to showcase custom stage code. The step payload
// comes from callback-catalog.ts, which was derived from the journey-client
// callback classes and adversarially verified against them + the core
// components (see callback-catalog.ts header).
//
// A single-metadata array entry per step: metadata.callbacks[0] backs the
// first (and only) callback; metadata.step.derived mocks the self-submit
// flags the generic submit-button logic reads.

// Single stage source shared by every catalog demo — mirrors what
// core/journey/stages/generic.svelte does with CallbackMapper + Form.
const CATALOG_STAGE_SOURCE = `<!--
  @component
  Type: stage
  Name: CallbackCatalogDemo

  DEMO COMPONENT — callback catalog viewer
  ────────────────────────────────────────
  Renders whatever callbacks the mock AM journey step carries through the
  REAL CallbackMapper. Not a component you would author — this demo exists
  to prove each AM callback type in the catalog renders correctly inside
  the preview.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { get } from 'svelte/store';

  import { Button, CallbackMapper, Form, styleStore } from '$login-framework';

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

  <Button busy={journey?.loading} style="primary" type="submit" width="full">Next</Button>
</Form>
`;

// This module's catalog entries come from callback-catalog.ts (raw AM Step
// payloads). Each entry's mockProps parses its payload through
// JSON.parse inside the sandbox and feeds it to createDemoStep — same
// real-machinery path every other demo uses.
function catalogMockProps(payloadJson: string): string {
  return `{
  form: { message: '', submit: () => console.log('submit') },
  formEl: null,
  journey: createDemoJourney(),
  metadata: {
    callbacks: [{ idx: 0, derived: { isFirstInvalidInput: false } }],
    step: { derived: { isStepSelfSubmittable: () => false, isUserInputOptional: false } },
  },
  step: createDemoStep({ callbacks: [JSON.parse(${JSON.stringify(payloadJson)})] }),
}`;
}

// DISPLAY_NAME — human label shown in the sidebar for each catalog demo.
const CATALOG_DISPLAY_PREFIX = 'AM: ';

// One catalog demo per AM callback type. Demo-only entries (no saveName) —
// they render mock payloads, they are not repo files to save.
export const callbackCatalogComponents: CustomComponentEntry[] = CATALOG_TYPES.map(
  (callbackType) => ({
    name: `${CATALOG_DISPLAY_PREFIX}${callbackType}`,
    kind: 'stage',
    source: CATALOG_STAGE_SOURCE,
    mockProps: catalogMockProps(callbackCatalog[callbackType]),
  }),
);

// Composite export: the repo-backed demo components first, then the catalog
// demos (one per AM callback type, IAM-12011 task 3). Order matters: the
// editor opens on the first `stage` entry, so the repo demos must lead. The
// catalog covers the 23 AM enum types core/ can render plus the
// deliberately-unregistered Unknown fallback.
export const customComponents: CustomComponentEntry[] = [
  ...repoCustomComponents,
  ...callbackCatalogComponents,
];
