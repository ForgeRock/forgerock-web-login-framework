export interface CustomComponentEntry {
  name: string;
  source: string;
  // JS object-literal source (not strict JSON) — lets mock props carry
  // functions for components that expect SDK-shaped objects (see the
  // custom-name.svelte entry below, which needs callback.getType() etc).
  mockProps: string;
  // Only the repo-backed entry can be saved — it's the only one with a real
  // file for the local save endpoint to write to.
  canSave?: boolean;
}

export const customComponents: CustomComponentEntry[] = [
  {
    name: 'welcome-banner.svelte',
    source: `<script>
  let { name = 'world' } = $props();
</script>

<h1>Hello {name}!</h1>
<style>
  h1 { color: #00a9e0; font-family: system-ui, sans-serif; }
</style>
`,
    mockProps: `{ name: 'AIC tenant' }`,
  },
  {
    name: 'otp-hint.svelte',
    source: `<script>
  let { digits = 6 } = $props();
</script>

<p>Enter the {digits}-digit code sent to your device.</p>
<style>
  p { color: #1c2430; font-family: system-ui, sans-serif; }
</style>
`,
    mockProps: `{ digits: 6 }`,
  },
  {
    name: 'terms-checkbox.svelte',
    source: `<script>
  let { label = 'I agree to the terms' } = $props();
  let checked = false;
</script>

<label>
  <input type="checkbox" bind:checked />
  {label}
</label>
<style>
  label { font-family: system-ui, sans-serif; color: #1c2430; }
</style>
`,
    mockProps: `{ label: 'I agree to the terms' }`,
  },
  {
    // Real repo file, verbatim: experimental/custom/demo/callbacks/custom-name/custom-name.svelte
    // Svelte 4 legacy syntax + framework-internal imports ($login-framework,
    // @forgerock/journey-client/types) — kept as-is to demonstrate what an
    // actual authored callback override looks like against the standalone
    // compiler path, not a hand-picked easy case.
    name: 'custom-name.svelte (repo, unmodified)',
    canSave: true,
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
];
