import { compileComponent } from './compiler';

// Mocks the `$login-framework` alias for the sandbox preview — the framework
// export surface authored callbacks/stages actually import from
// (experimental/custom/login-framework.ts re-exports Stacked, interpolate,
// textToKey, etc). Without this, any real callback/stage component fails to
// preview with "Failed to resolve module specifier '$login-framework'".
//
// `Stacked` is mocked as a real compiled Svelte component (built with the
// same compiler this PoC uses) rather than a plain function, since the
// generated client code calls it inline as `Stacked(anchor, props)` — Svelte
// 5's client component calling convention, not a plain function call.
const MOCK_STACKED_SOURCE = `<script>
  let { label = '', value = '', onChange, type = 'text', key = '' } = $props();
</script>

<label class="mock-stacked" data-key={key} style="display:flex; flex-direction:column; gap:4px; font-size:12px; color:#69788b;">
  <span>{label}</span>
  <input {type} {value} oninput={onChange} style="border:1px solid #e2e5ea; border-radius:4px; padding:6px 8px; font-size:13px;" />
</label>
`;

function buildStackedModule(): string {
  const { js, error } = compileComponent(MOCK_STACKED_SOURCE);
  if (error) {
    throw new Error(`mock Stacked component failed to compile: ${error}`);
  }
  // The compiled output default-exports a function named `Component` (and
  // self-references that name once, in the legacy class-component check) —
  // rename to `Stacked` so it can be re-exported under the real name authored
  // components import.
  return js
    .replace(/\bComponent\b/g, 'Stacked')
    .replace('export default function Stacked', 'export function Stacked');
}

const HELPER_EXPORTS = `
export function interpolate(key, params, fallback) {
  return fallback ?? key;
}

export function textToKey(text) {
  return String(text).toLowerCase().replace(/\\s+/g, '-');
}
`;

export function buildLoginFrameworkMockDataUrl(): string {
  const moduleSource = `${buildStackedModule()}\n${HELPER_EXPORTS}`;
  const base64 = btoa(unescape(encodeURIComponent(moduleSource)));
  return `data:text/javascript;base64,${base64}`;
}
