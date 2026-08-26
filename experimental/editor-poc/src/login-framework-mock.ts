import { compileComponent } from './compiler';

// Mocks the `$login-framework` alias for the sandbox preview — the framework
// export surface authored callbacks/stages actually import from
// (experimental/custom/login-framework.ts re-exports Stacked, interpolate,
// textToKey, Alert, Button, Form, T, CallbackMapper, convertStringToKey,
// captureLinks, styleStore, etc). Without this, any real callback/stage
// component fails to preview with "Failed to resolve module specifier
// '$login-framework'".
//
// Each UI export is mocked as a real compiled Svelte component (built with
// the same compiler this PoC uses) rather than a plain function, since the
// generated client code calls them inline as `Name(anchor, props)` — Svelte
// 5's client component calling convention, not a plain function call.
// Coverage here tracks what's actually imported by components in
// components.ts — extend as new repo components are added to the PoC.
const MOCK_COMPONENT_SOURCES: Record<string, string> = {
  Stacked: `<script>
  let { label = '', value = '', onChange, type = 'text', key = '' } = $props();
</script>

<label class="mock-stacked" data-key={key} style="display:flex; flex-direction:column; gap:4px; font-size:12px; color:#69788b;">
  <span>{label}</span>
  <input {type} {value} oninput={onChange} style="border:1px solid #e2e5ea; border-radius:4px; padding:6px 8px; font-size:13px;" />
</label>
`,
  Alert: `<script>
  let { id = '', needsFocus = false, type = 'info', children } = $props();
</script>

<div {id} role="alert" data-type={type} style="border:1px solid #f7685b; background:#fef2f1; color:#f7685b; border-radius:6px; padding:8px 12px; font-size:13px;">
  {@render children?.()}
</div>
`,
  Form: `<script>
  let { formEl = $bindable(null), ariaDescribedBy = null, onSubmitWhenValid, children } = $props();
</script>

<form
  bind:this={formEl}
  aria-describedby={ariaDescribedBy}
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitWhenValid?.();
  }}
>
  {@render children?.()}
</form>
`,
  // interpolate() is referenced without an import: this component's compiled
  // body ends up concatenated into the same module as HELPER_EXPORTS (see
  // buildLoginFrameworkMockDataUrl), so interpolate is already in scope.
  // Importing it here would create a second, colliding \`interpolate\`
  // binding — one from this line's import, one from HELPER_EXPORTS's own
  // \`export function interpolate\` — a duplicate-declaration SyntaxError.
  T: `<script>
  let { key = '', html = false } = $props();
</script>

{#if html}
  {@html interpolate(key)}
{:else}
  {interpolate(key)}
{/if}
`,
  CallbackMapper: `<script>
  // Stub only — real callback-mapper.svelte dispatches to a per-callback-type
  // component. Mock props in components.ts pass an empty \`step.callbacks\`,
  // so this is imported but never actually rendered.
  let { props = {} } = $props();
</script>
`,
};

// Every compiled component starts with the same handful of shared-runtime
// import lines (svelte/legacy, svelte/internal/*). Concatenating multiple
// compiled modules into one file — which this mock does — would otherwise
// redeclare the same bound identifiers (`$$_createClassComponent`, `$`)
// once per component and throw a SyntaxError at parse time. Split each
// compiled module into its leading import lines and its body so the caller
// can dedupe imports across all components and emit each import line once.
function splitLeadingImports(js: string): { imports: string[]; body: string } {
  const lines = js.split('\n');
  let splitIndex = 0;
  while (splitIndex < lines.length && lines[splitIndex].startsWith('import ')) {
    splitIndex += 1;
  }
  return {
    imports: lines.slice(0, splitIndex),
    body: lines.slice(splitIndex).join('\n'),
  };
}

function buildComponentModule(name: string, source: string): { imports: string[]; body: string } {
  const { js, error } = compileComponent(source);
  if (error) {
    throw new Error(`mock ${name} component failed to compile: ${error}`);
  }
  // The compiled output default-exports a function named `Component` (and
  // self-references that name once, in the legacy class-component check) —
  // rename to the real export name authored components import.
  //
  // Every compiled component also declares its own top-level `var root =
  // $.from_html(...)` (and `root_1`, `root_2`, ... for additional templates
  // in the same component). Concatenating multiple components' bodies into
  // one module — which this mock does — puts all of those `var root`
  // declarations in the same module scope. `var` redeclaration is legal, so
  // this doesn't throw at parse time, but every component's `root` ends up
  // aliased to whichever component's initializer ran last, and calling that
  // wrong template function hands the DOM-traversal helpers (`$.sibling`,
  // `$.child`, ...) a tree shaped nothing like the one the calling
  // component's code assumes — which eventually walks off the end of that
  // tree and calls a native getter on `null` (TypeError: Illegal
  // invocation). Namespace each component's template vars by name so they
  // can't collide.
  const renamed = js
    .replace(/\bComponent\b/g, name)
    .replace(`export default function ${name}`, `export function ${name}`)
    .replace(/\broot(_\d+)?\b/g, `${name}Root$1`);
  return splitLeadingImports(renamed);
}

const HELPER_EXPORTS = `
// interpolate() falls back to the raw key when a caller doesn't pass its own
// fallback text (e.g. <T key="dontHaveAnAccount" html={true} />). Extend this
// as new keys show up unresolved in preview.
// Kept in sync by hand with core/locales/us/en/index.json — same drift risk
// R4 flags for the rest of this stub.
const MOCK_TRANSLATIONS = {
  dontHaveAnAccount: "No account? <a href='?journey=Registration'>Register here!</a>",
};

export function interpolate(key, params, fallback) {
  return fallback ?? MOCK_TRANSLATIONS[key] ?? key;
}

export function textToKey(text) {
  return String(text).toLowerCase().replace(/\\s+/g, '-');
}

export function convertStringToKey(text) {
  return String(text ?? '').toLowerCase().replace(/\\s+/g, '-');
}

export function captureLinks(_element, _journey) {
  // No-op: real captureLinks() wires anchor-click interception for modal-mode
  // journey navigation, irrelevant to a standalone preview iframe with no
  // journey instance.
}

export const styleStore = {
  subscribe(run) {
    run({});
    return () => {};
  },
};
`;

export function buildLoginFrameworkMockDataUrl(): string {
  const compiled = Object.entries(MOCK_COMPONENT_SOURCES).map(([name, source]) =>
    buildComponentModule(name, source),
  );

  const sharedImports = [...new Set(compiled.flatMap(({ imports }) => imports))];
  const bodies = compiled.map(({ body }) => body).join('\n');

  const moduleSource = `${sharedImports.join('\n')}\n${bodies}\n${HELPER_EXPORTS}`;
  const base64 = btoa(unescape(encodeURIComponent(moduleSource)));
  return `data:text/javascript;base64,${base64}`;
}
