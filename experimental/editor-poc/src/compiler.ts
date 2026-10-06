import { compile } from 'svelte/compiler';
import ts from 'typescript';

export interface CompileResult {
  js: string;
  css: string;
  error: string | null;
}

const MOUNT_WRAPPER_MARKER = '/* __MOUNT_WRAPPER_START__ */';

// Mirrors svelte/src/utils.js hash() — not part of the public compiler API, so
// duplicated here to derive our own content-based style id (see below).
function hash(str: string): string {
  let hashValue = 5381;
  let i = str.length;
  while (i--) {
    hashValue = ((hashValue << 5) - hashValue) ^ str.charCodeAt(i);
  }
  return (hashValue >>> 0).toString(36);
}

// svelte.compile() doesn't strip TypeScript itself — the real widget build
// relies on vite-plugin-svelte's preprocessor for that. Mirror it with
// ts.transpileModule against just the <script lang="ts"> block.
function stripScriptTypeScript(source: string): string {
  const scriptTagPattern = /<script(\s+lang=["']ts["'])?([^>]*)>([\s\S]*?)<\/script>/;
  const match = source.match(scriptTagPattern);
  if (!match || !match[1]) {
    return source;
  }
  const [fullMatch, , restAttributes, scriptBody] = match;
  const transpiled = ts.transpileModule(scriptBody, {
    // verbatimModuleSyntax keeps every non-`import type` import exactly as
    // written — without it, transpileModule's per-file elision heuristic
    // drops any import whose binding isn't referenced inside the extracted
    // <script> text, which breaks components (like this one) that only use
    // an import inside the markup below the script block.
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      verbatimModuleSyntax: true,
    },
  }).outputText;
  return source.replace(fullMatch, `<script${restAttributes}>\n${transpiled}</script>`);
}

export function compileComponent(source: string): CompileResult {
  try {
    const plainSource = stripScriptTypeScript(source);
    const result = compile(plainSource, {
      generate: 'client',
      css: 'injected',
      // Fixed filename gives every component the same exported identifier
      // ('Component') — getMountCode()'s `mount(Component, ...)` call depends on it.
      filename: 'Component.svelte',
      compatibility: { componentApi: 4 },
    });

    // BUT: with a fixed filename, Svelte also derives the injected <style> tag's
    // id from that filename rather than the CSS content (see svelte/compiler
    // validate-options.js: cssHash uses `filename` whenever one is set). Every
    // recompile then gets the SAME style id, so the runtime's append_styles()
    // — which skips re-injecting a style whose id already exists in the iframe's
    // <head> — never re-injects edited CSS on re-render, even though JS/markup
    // changes do show up. Re-derive the id from the actual CSS content and swap
    // it in everywhere the compiler emitted the old, filename-derived one.
    //
    // `result.css` is null with `css: 'injected'` — the compiled style info only
    // exists inline in `js.code` as a `$$css` object literal. Svelte formats it
    // either single-line (`{ hash: '...', code: '...' };`) or multi-line/tabbed
    // depending on the rest of the component, so match across whitespace rather
    // than assuming one exact layout.
    let js = result.js.code;
    const embeddedCss = js.match(
      /const \$\$css = \{\s*hash: '([^']+)',\s*code: '((?:[^'\\]|\\.)*)'\s*\};/,
    );
    let css = '';
    if (embeddedCss) {
      const [, oldHash, cssCode] = embeddedCss;
      css = cssCode;
      const contentHash = `svelte-${hash(cssCode)}`;
      js = js.replaceAll(oldHash, contentHash);
    }

    return { js, css, error: null };
  } catch (error) {
    return { js: '', css: '', error: error instanceof Error ? error.message : String(error) };
  }
}

// Equivalent to LiveCodes fork's getMountCode() restore (SDKS-5259) — appends
// a mount call so the compiled output can self-render inside the preview iframe.
// mockPropsExpr is a raw JS object-literal expression (not JSON) so mock props
// can carry functions for components expecting SDK-shaped objects.
export function getMountCode(compiledJs: string, mockPropsExpr: string): string {
  return [
    compiledJs,
    MOUNT_WRAPPER_MARKER,
    `import { mount } from 'svelte';`,
    `mount(Component, { target: document.getElementById('preview-root'), props: (${mockPropsExpr}) });`,
  ].join('\n');
}

// Equivalent to LivecodesEditor.svelte's mount-wrapper strip (SDKS-5259) —
// removes the preview-only mount call before the bundle is saved to GCS.
export function stripMountWrapper(codeWithMount: string): string {
  const markerIndex = codeWithMount.indexOf(MOUNT_WRAPPER_MARKER);
  return markerIndex === -1 ? codeWithMount : codeWithMount.slice(0, markerIndex).trimEnd();
}
