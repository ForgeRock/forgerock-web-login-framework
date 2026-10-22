// IAM-12011 T5 proof: the "injected framework" loading mechanism. A compiled
// custom component imports bare specifiers (svelte, svelte/internal/client,
// $login-framework, ...). Instead of resolving them through an import map,
// the publish step rewrites those imports so the module becomes a factory that
// receives the host's framework instance. These tests pin the rewrite contract;
// the browser proof (proof/framework-sharing.ts) shows it works end to end.
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { compileComponent } from './compiler';
import { rewriteImportsToInjection } from './inject-framework';

const SAMPLE_SOURCE = `<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { Button, T } from '$login-framework';
  export let form;
  let count = 0;
  const unused = writable(0);
  onMount(() => { count = 1; });
</script>
<Button><T key="loginHeader" /> {count}</Button>
<style>main { color: red; }</style>`;

const compileSample = (): string => {
  const compiled = compileComponent(SAMPLE_SOURCE);
  expect(compiled.error).toBeNull();
  return compiled.js;
};

const parseOutput = (code: string): ts.SourceFile =>
  ts.createSourceFile('out.js', code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);

describe('rewriteImportsToInjection', () => {
  it('removes every import declaration from compiled output', () => {
    const result = rewriteImportsToInjection(compileSample());

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') {
      return;
    }
    const importDeclarations = parseOutput(result.code).statements.filter(ts.isImportDeclaration);
    expect(importDeclarations).toHaveLength(0);
  });

  it('reads each imported binding from the injected framework object', () => {
    const result = rewriteImportsToInjection(compileSample());

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') {
      return;
    }
    expect(result.code).toContain('__framework["svelte/internal/client"]');
    expect(result.code).toContain('__framework["svelte/legacy"]');
    expect(result.code).toContain('__framework["svelte"]');
    expect(result.code).toContain('__framework["svelte/store"]');
    expect(result.code).toContain('__framework["$login-framework"]');
  });

  it('reports which specifiers the host must provide and which it must have preloaded', () => {
    const result = rewriteImportsToInjection(compileSample());

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') {
      return;
    }
    expect([...result.injectedSpecifiers].sort()).toEqual(
      [
        '$login-framework',
        'svelte',
        'svelte/internal/client',
        'svelte/legacy',
        'svelte/store',
      ].sort(),
    );
    expect([...result.hostPreloadedSpecifiers].sort()).toEqual([
      'svelte/internal/disclose-version',
      'svelte/internal/flags/legacy',
    ]);
  });

  it('turns the default export into the return value of a single factory', () => {
    const result = rewriteImportsToInjection(compileSample());

    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') {
      return;
    }
    const statements = parseOutput(result.code).statements;
    const exportedFactories = statements.filter(
      (statement) =>
        ts.isFunctionDeclaration(statement) &&
        (ts.getCombinedModifierFlags(statement) & ts.ModifierFlags.ExportDefault) ===
          ts.ModifierFlags.ExportDefault,
    );
    expect(exportedFactories).toHaveLength(1);
    expect(result.code).toMatch(/return Component;\s*}\s*$/);
  });

  it('rejects output that exports anything besides the default component', () => {
    const result = rewriteImportsToInjection(
      `import * as $ from 'svelte/internal/client';\nexport const extra = 1;\nexport default function Component() {}`,
    );

    expect(result.kind).toBe('error');
  });
});
