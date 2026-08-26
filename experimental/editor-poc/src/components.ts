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
];
