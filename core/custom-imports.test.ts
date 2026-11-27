/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { describe, expect, it } from 'vitest';

import {
  checkCustomImports,
  isExcludedFromCustomImports,
  parseCustomImports,
  scanCustomComponents,
} from './custom-imports';

const projectRoot = resolve(import.meta.dirname, '..');
const customRoot = resolve(projectRoot, 'custom/components');

/** Checks one import statement against a customer file at `custom/components/<dir>`. */
const checkOne = (specifier: string, importerDir: string, isTypeOnly = false) =>
  checkCustomImports({
    imports: parseCustomImports(
      isTypeOnly ? `import type { X } from '${specifier}';` : `import { X } from '${specifier}';`,
    ),
    importerDir: resolve(customRoot, importerDir),
    customRoot,
  });

describe('parseCustomImports', () => {
  it('parses a named import with its specifier', () => {
    const imports = parseCustomImports(`import { Stacked } from '$login-framework';`);
    expect(imports).toEqual([
      { specifier: '$login-framework', isTypeOnly: false, kind: 'import', line: 1 },
    ]);
  });

  it('parses an inline type-only specifier as type-only', () => {
    const imports = parseCustomImports(
      `import { type NameCallback } from '@forgerock/journey-client/types';`,
    );
    expect(imports).toEqual([
      {
        specifier: '@forgerock/journey-client/types',
        isTypeOnly: true,
        kind: 'import',
        line: 1,
      },
    ]);
  });

  it('parses an `import type` declaration as type-only', () => {
    const imports = parseCustomImports(
      `import type { CustomWrapperProps } from '$login-framework';`,
    );
    expect(imports).toEqual([
      { specifier: '$login-framework', isTypeOnly: true, kind: 'import', line: 1 },
    ]);
  });

  it('parses a bare default import', () => {
    const imports = parseCustomImports(`import Svelte from 'svelte';`);
    expect(imports).toEqual([{ specifier: 'svelte', isTypeOnly: false, kind: 'import', line: 1 }]);
  });

  it('parses a re-export from another module as an export declaration', () => {
    const imports = parseCustomImports(`export { AppConfig } from '$core/constants';`);
    expect(imports).toEqual([
      { specifier: '$core/constants', isTypeOnly: false, kind: 'export-from', line: 1 },
    ]);
  });

  it('parses a dynamic import call', () => {
    const imports = parseCustomImports(`const mod = import('$core/style.store');`);
    expect(imports).toEqual([
      { specifier: '$core/style.store', isTypeOnly: false, kind: 'dynamic', line: 1 },
    ]);
  });

  it('flags a dynamic import with a non-literal argument as a placeholder (fail closed)', () => {
    const imports = parseCustomImports(
      `const mod = import(someVariable);\nconst other = import(\`\${base}/x\`);`,
    );
    expect(imports).toHaveLength(2);
    for (const importEntry of imports) {
      expect(importEntry.kind).toBe('dynamic');
      expect(importEntry.specifier).toBe('<dynamic import>');
    }
    expect(imports[0]?.line).toBe(1);
    expect(imports[1]?.line).toBe(2);
  });

  it('flags import.meta.glob as a violation with its source line (Svelte)', () => {
    const imports = parseCustomImports(
      ['<script lang="ts">', '  const modules = import.meta.glob("../../*");', '</script>'].join(
        '\n',
      ),
    );
    expect(imports).toHaveLength(1);
    expect(imports[0]?.specifier).toBe('import.meta.glob(...)');
    expect(imports[0]?.kind).toBe('dynamic');
    expect(imports[0]?.line).toBe(2);
  });

  it('flags import.meta.glob inside a plain TS file', () => {
    const imports = parseCustomImports(`const modules = import.meta.globEager('/core/*');`);
    expect(imports).toHaveLength(1);
    expect(imports[0]?.specifier).toBe('import.meta.glob(...)');
  });

  it('ignores imports inside block and line comments', () => {
    const imports = parseCustomImports(`
/**
 * import { X } from '$core/constants';
 */
// import { Y } from '$journey/journey.store';
import { T } from '$login-framework';
`);
    expect(imports).toEqual([
      { specifier: '$login-framework', isTypeOnly: false, kind: 'import', line: 6 },
    ]);
  });

  it('ignores import-like text inside string literals', () => {
    const imports = parseCustomImports(`const message = "import { X } from '$core/constants';";`);
    expect(imports).toEqual([]);
  });

  it('parses a side-effect-only import', () => {
    const imports = parseCustomImports(`import './theme.css';`);
    expect(imports).toEqual([
      { specifier: './theme.css', isTypeOnly: false, kind: 'import', line: 1 },
    ]);
  });

  it('strips a UTF-8 BOM so the first import is parsed', () => {
    // Built from its char code: a literal BOM trips ESLint's
    // no-irregular-whitespace rule.
    const source = `${String.fromCharCode(0xfeff)}import { X } from '$core/style.store';`;
    const imports = parseCustomImports(source);
    expect(imports).toEqual([
      { specifier: '$core/style.store', isTypeOnly: false, kind: 'import', line: 1 },
    ]);
  });

  it('reduces a Svelte file to its script blocks: markup cannot desync the parser', () => {
    // The reproduced desync: a lone backtick in markup before the script
    // swallowed the forbidden import when the whole file was parsed as TS.
    const imports = parseCustomImports(
      [
        '<div>markup with a stray ` backtick</div>',
        '<script lang="ts">',
        "  import { styleStore } from '$core/style.store';",
        '</script>',
      ].join('\n'),
      { isSvelte: true },
    );
    expect(imports).toEqual([
      { specifier: '$core/style.store', isTypeOnly: false, kind: 'import', line: 3 },
    ]);
  });

  it('extracts both module-context and instance script blocks with correct line offsets', () => {
    const imports = parseCustomImports(
      [
        '<script context="module" lang="ts">',
        "  import { a } from '$core/one';",
        '</script>',
        '',
        '<div>hi</div>',
        '<script lang="ts">',
        "  import { b } from '$journey/two';",
        '</script>',
      ].join('\n'),
      { isSvelte: true },
    );
    expect(imports.map((importEntry) => importEntry.line)).toEqual([2, 7]);
  });

  it('falls back to whole-file parsing when the Svelte compiler rejects the text', () => {
    // A file with a genuine syntax error: the consumer build reports it; the
    // boundary sweep must still parse what it can (degrade, never crash).
    const imports = parseCustomImports('<script>\nimport { X } from "svelte";\n', {
      isSvelte: true,
    });
    expect(imports.length).toBeGreaterThanOrEqual(1);
  });

  it('scans markup expressions ({#await import(...)}) with correct line offsets', () => {
    // Svelte 5 compiles template expressions into real runtime imports; a
    // dynamic import hiding in a markup expression must not escape the scan.
    const imports = parseCustomImports(
      [
        '<script lang="ts">',
        "  import { Button } from '$login-framework';",
        '</script>',
        '',
        "{#await import('$core/style.store') then mod}",
        '  <p>{mod.styleStore}</p>',
        '{/await}',
      ].join('\n'),
      { isSvelte: true },
    );
    const dynamic = imports.filter((importEntry) => importEntry.kind === 'dynamic');
    expect(dynamic).toHaveLength(1);
    expect(dynamic[0]?.specifier).toBe('$core/style.store');
    expect(dynamic[0]?.line).toBe(5);
  });

  it('scans attribute expressions in markup', () => {
    const imports = parseCustomImports(
      [
        '<div',
        "  on:click={() => import('$journey/journey.store').then(m => m.journeyStore)}",
        '>',
        '</div>',
      ].join('\n'),
      { isSvelte: true },
    );
    const dynamic = imports.filter((importEntry) => importEntry.kind === 'dynamic');
    expect(dynamic).toHaveLength(1);
    expect(dynamic[0]?.specifier).toBe('$journey/journey.store');
    expect(dynamic[0]?.line).toBe(2);
  });

  it('flags require() of a forbidden module (Vite commonjs converts it to an import)', () => {
    const imports = parseCustomImports(`const store = require('$core/style.store');`);
    expect(imports).toHaveLength(1);
    expect(imports[0]?.specifier).toBe('$core/style.store');
    expect(imports[0]?.kind).toBe('dynamic');
  });

  it('flags computed require() as forbidden-dynamic', () => {
    const violations = checkCustomImports({
      imports: parseCustomImports(`const store = require(basePath + '/core/store');`),
      importerDir: resolve(customRoot, 'stages/login'),
      customRoot,
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('forbidden-dynamic');
  });

  it('flags a multiline import.meta.glob call', () => {
    const imports = parseCustomImports(
      ['const modules = import.meta.glob(', "  '../../core/*.ts'", ');'].join('\n'),
    );
    expect(imports).toHaveLength(1);
    expect(imports[0]?.specifier).toBe('import.meta.glob(...)');
    expect(imports[0]?.line).toBe(1);
  });

  it('flags a generic-typed import.meta.glob call', () => {
    const imports = parseCustomImports(
      `const modules = import.meta.glob<Record<string, unknown>>('../../core/*.ts');`,
    );
    expect(imports).toHaveLength(1);
    expect(imports[0]?.specifier).toBe('import.meta.glob(...)');
  });

  it('reports correct line numbers for a glob call on a later line', () => {
    const imports = parseCustomImports(
      `const a = 1;\nconst b = 2;\nconst mods = import.meta.glob('../../core/*');`,
    );
    expect(imports).toHaveLength(1);
    expect(imports[0]?.line).toBe(3);
  });

  it('treats a TS file containing an embedded <script> HTML string as plain TS (extension-gated)', () => {
    // The fail-open regression the completeness critic proved end-to-end: a
    // text-based <script> check misrouted this file through the Svelte
    // extractor, which scanned only the code inside the pair and missed the
    // forbidden import outside it. Discrimination is now by file extension.
    const sourceText = [
      `const html = "<script>const x = 1;</script>";`,
      `import { styleStore } from '$core/style.store';`,
    ].join('\n');
    const asTs = parseCustomImports(sourceText, { isSvelte: false });
    expect(asTs).toHaveLength(1);
    expect(asTs[0]?.specifier).toBe('$core/style.store');

    // Same text through the Svelte path: the compiler's view treats the
    // embedded pair as a real script block, but the whole-file TS pass still
    // sees the import outside it (fail-closed union), so nothing the pre-fix
    // parser could see is ever missed.
    const asSvelte = parseCustomImports(sourceText, { isSvelte: true });
    expect(asSvelte).toHaveLength(1);
    expect(asSvelte[0]?.specifier).toBe('$core/style.store');
  });
});

describe('checkCustomImports (forbidden aliases)', () => {
  it.each([
    ['$core/style.store', 'layout'],
    ['$core', 'stages/login'],
    ['$components/primitives/button/button.svelte', 'callbacks/name'],
    ['$journey/journey.store', 'stages/login'],
    ['$journey/_utilities/step.utilities', 'callbacks/name'],
    ['$locales/us/en', 'layout'],
  ])('fails the internal alias %s from a customer file', (specifier, importerDir) => {
    const violations = checkOne(specifier, importerDir);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('forbidden-alias');
    expect(violations[0]?.specifier).toBe(specifier);
  });

  it('fails an unknown $-alias the same way (fail closed)', () => {
    const violations = checkOne('$widget/internals', 'stages/login');
    expect(violations[0]?.kind).toBe('forbidden-alias');
  });

  it('fails an internal alias even when imported type-only', () => {
    const violations = checkOne('$core/style.store', 'layout', true);
    expect(violations[0]?.kind).toBe('forbidden-alias');
  });

  it('fails a dynamic import of an internal alias', () => {
    const violations = checkCustomImports({
      imports: parseCustomImports(`const mod = import('$core/style.store');`),
      importerDir: resolve(customRoot, 'stages/login'),
      customRoot,
    });
    expect(violations[0]?.kind).toBe('forbidden-alias');
  });

  it('allows the curated surface specifier $login-framework', () => {
    expect(checkOne('$login-framework', 'layout')).toEqual([]);
    expect(checkOne('$login-framework', 'stages/login', true)).toEqual([]);
  });

  it('allows the customer-directory alias $custom', () => {
    expect(checkOne('$custom/stages/login/login.svelte', 'layout')).toEqual([]);
  });

  it('allows bare external packages (svelte, storybook, other npm)', () => {
    expect(checkOne('svelte', 'layout')).toEqual([]);
    expect(checkOne('svelte/store', 'stages/login')).toEqual([]);
    expect(checkOne('storybook/test', 'layout')).toEqual([]);
  });
});

describe('checkCustomImports (journey-client contract)', () => {
  it('allows the type-only journey-client types contract', () => {
    expect(checkOne('@forgerock/journey-client/types', 'stages/login', true)).toEqual([]);
    expect(
      checkCustomImports({
        imports: parseCustomImports(
          `import { type NameCallback } from '@forgerock/journey-client/types';`,
        ),
        importerDir: resolve(customRoot, 'callbacks/name'),
        customRoot,
      }),
    ).toEqual([]);
  });

  it('fails a runtime import of the journey-client package root', () => {
    const violations = checkOne('@forgerock/journey-client', 'callbacks/name');
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('forbidden-external');
  });

  it('fails a runtime import of a journey-client subpath', () => {
    expect(checkOne('@forgerock/journey-client/webauthn', 'callbacks/name')[0]?.kind).toBe(
      'forbidden-external',
    );
  });

  it('fails a runtime (non-type) import of the types subpath', () => {
    const violations = checkOne('@forgerock/journey-client/types', 'stages/login');
    expect(violations[0]?.kind).toBe('forbidden-external');
  });

  it('fails a re-export from the journey-client package root', () => {
    const violations = checkCustomImports({
      imports: parseCustomImports(`export { callbackType } from '@forgerock/journey-client';`),
      importerDir: resolve(customRoot, 'callbacks/name'),
      customRoot,
    });
    expect(violations[0]?.kind).toBe('forbidden-external');
  });
});

describe('checkCustomImports (relative escapes)', () => {
  it('fails a relative import that escapes custom/components/', () => {
    const violations = checkOne('../../core/style.store', 'layout');
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('relative-escape');
  });

  it('fails a deep relative escape from a nested directory', () => {
    expect(checkOne('../../../../core/journey/journey.store', 'stages/login')[0]?.kind).toBe(
      'relative-escape',
    );
  });

  it('allows a relative import inside custom/components/', () => {
    expect(checkOne('./login.svelte', 'stages/login')).toEqual([]);
    expect(checkOne('../shared/helpers', 'callbacks/name')).toEqual([]);
  });

  it('fails a type-only relative escape', () => {
    const violations = checkOne('../../core/interfaces', 'layout', true);
    expect(violations[0]?.kind).toBe('relative-escape');
  });
});

describe('checkCustomImports (specifier shapes that bypass the alias check)', () => {
  it.each([
    ['$custom/../../core/journey/journey.store', 'stages/login'],
    ['/abs/path/core/x.ts', 'layout'],
    ['/core/x.ts', 'layout'],
    ['/@fs/core/x.ts', 'layout'],
    ['file:///core/x.ts', 'layout'],
  ])('fails the escape-shaped specifier %s', (specifier, importerDir) => {
    const violations = checkOne(specifier, importerDir);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('relative-escape');
    expect(violations[0]?.specifier).toBe(specifier);
  });

  it('fails a backslash-leading specifier', () => {
    // String.raw keeps the doubled backslashes in the generated source so
    // the string-literal parser collapses them into single ones: the
    // specifier value the bundler sees is '\core\x.ts'.
    const violations = checkCustomImports({
      imports: parseCustomImports(String.raw`import { X } from '\\core\\x.ts';`),
      importerDir: resolve(customRoot, 'layout'),
      customRoot,
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('relative-escape');
    expect(violations[0]?.specifier).toBe('\\core\\x.ts');
  });

  it('fails a Windows-style relative escape with backslash separators', () => {
    // The backslash form of the existing '../../core/style.store' escape:
    // same resolution, same violation, only the separators differ.
    const violations = checkCustomImports({
      imports: parseCustomImports(String.raw`import { X } from '..\\..\\core\\style.store';`),
      importerDir: resolve(customRoot, 'layout'),
      customRoot,
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('relative-escape');
  });

  it('fails a $custom specifier whose escape only appears after alias resolution', () => {
    // $custom/... passes the alias allowlist, so the violation can surface
    // only when the rest of the specifier resolves against the custom root.
    const violations = checkOne('$custom/..', 'layout');
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('relative-escape');
  });

  it.each([['C:\\core\\x.ts', 'C:/core/x.ts']])(
    'fails the Windows drive-letter absolute specifier %s',
    (specifier, importerDir) => {
      const violations = checkOne(specifier, importerDir);
      expect(violations).toHaveLength(1);
      expect(violations[0]?.kind).toBe('relative-escape');
    },
  );

  it('allows absolute and file:// specifiers that resolve inside the custom root', () => {
    const inside = resolve(customRoot, 'stages/login/login.svelte');
    expect(checkOne(inside, 'stages/login')).toEqual([]);
    expect(checkOne(`file://${inside}`, 'stages/login')).toEqual([]);
  });

  it('allows the documented specifier forms (regression guard for the shape checks)', () => {
    expect(checkOne('$custom/components/stages/x/x.svelte', 'layout')).toEqual([]);
    expect(checkOne('$custom/layout/header.svelte', 'stages/login')).toEqual([]);
    expect(checkOne('./sibling', 'stages/login')).toEqual([]);
    expect(checkOne('../callbacks/x/x.svelte', 'stages/login')).toEqual([]);
    expect(checkOne('$login-framework', 'layout')).toEqual([]);
  });
});

describe('checkCustomImports (production imports of exempt files)', () => {
  it('fails a production import of a sibling mock file (extension-resolved)', () => {
    // A stage reaching "./internals.mock" pulls in a file the boundary never
    // scans, so the import itself must fail closed.
    const violations = checkOne('./internals.mock', 'stages/login');
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('forbidden-exempt-import');
    expect(violations[0]?.specifier).toBe('./internals.mock');
  });

  it.each([
    ['./internals.mock.ts', 'stages/login'],
    ['./custom-login.stories.js', 'stages/custom-login'],
    ['./custom-login.story.svelte', 'stages/custom-login'],
    ['./name.test.ts', 'callbacks/name'],
    ['./name.d.ts', 'callbacks/name'],
  ])(
    'fails an import naming an exempt file with its full extension %s',
    (specifier, importerDir) => {
      const violations = checkOne(specifier, importerDir);
      expect(violations).toHaveLength(1);
      expect(violations[0]?.kind).toBe('forbidden-exempt-import');
    },
  );

  it('fails a relative import of the curated surface file', () => {
    // login-framework.ts re-exports framework internals by design; reaching
    // it by path bypasses the curated-surface contract.
    const violations = checkOne('../../login-framework', 'stages/login');
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('forbidden-exempt-import');
  });

  it('fails a $custom import of an exempt file', () => {
    const violations = checkOne('$custom/stages/login/internals.mock', 'layout');
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('forbidden-exempt-import');
  });

  it('fails an absolute path naming an exempt file inside the custom root', () => {
    // The escape gate allows absolutes that resolve inside the root, but the
    // exempt-import gate must still inspect the target: an unchecked mock
    // reached by absolute path is the same F62 bypass.
    const target = resolve(customRoot, 'stages/login/internals.mock.ts');
    const violations = checkOne(target, 'stages/login');
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('forbidden-exempt-import');
  });

  it('fails a file:// specifier naming the curated surface file', () => {
    const target = `file://${resolve(customRoot, 'login-framework.ts')}`;
    const violations = checkOne(target, 'stages/login');
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('forbidden-exempt-import');
  });

  it('allows a production import of a normal sibling component', () => {
    expect(checkOne('./login.svelte', 'stages/login')).toEqual([]);
    expect(checkOne('./helpers', 'stages/login')).toEqual([]);
  });

  it('still exempts the exempt file itself from the sweep (its own imports stay unchecked)', () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'custom-imports-'));
    try {
      mkdirSync(join(fixtureRoot, 'custom/components/stages/login'), { recursive: true });
      writeFileSync(
        join(fixtureRoot, 'custom/components/stages/login/internals.mock.ts'),
        `export { styleStore } from '$core/style.store';\n`,
      );
      expect(scanCustomComponents(fixtureRoot)).toEqual([]);
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it('flags a production stage whose only violation is importing the mock (sweep fixture)', () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'custom-imports-'));
    try {
      mkdirSync(join(fixtureRoot, 'custom/components/stages/login'), { recursive: true });
      writeFileSync(
        join(fixtureRoot, 'custom/components/stages/login/internals.mock.ts'),
        [
          `export { styleStore } from '$core/style.store';`,
          `export const internals = { styleStore };`,
          '',
        ].join('\n'),
      );
      writeFileSync(
        join(fixtureRoot, 'custom/components/stages/login/login.svelte'),
        `<script lang="ts">\n  import { internals } from './internals.mock';\n</script>\n`,
      );
      const files = scanCustomComponents(fixtureRoot);
      expect(files).toHaveLength(1);
      expect(files[0]?.violations).toHaveLength(1);
      expect(files[0]?.violations[0]?.kind).toBe('forbidden-exempt-import');
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});

describe('checkCustomImports (violation detail)', () => {
  it('reports the source line of the offending import', () => {
    const violations = checkCustomImports({
      imports: parseCustomImports(
        `import { T } from '$login-framework';\nimport { styleStore } from '$core/style.store';`,
      ),
      importerDir: resolve(customRoot, 'layout'),
      customRoot,
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.line).toBe(2);
  });

  it('reports every violation in one file, not just the first', () => {
    const violations = checkCustomImports({
      imports: parseCustomImports(`
import { styleStore } from '$core/style.store';
import { callbackType } from '@forgerock/journey-client';
import { missing } from '$journey/journey.store';
`),
      importerDir: resolve(customRoot, 'stages/login'),
      customRoot,
    });
    expect(violations.map((violation) => violation.kind)).toEqual([
      'forbidden-alias',
      'forbidden-external',
      'forbidden-alias',
    ]);
  });

  it('fails a computed dynamic import closed (unresolvable specifier)', () => {
    const violations = checkCustomImports({
      imports: parseCustomImports(`const mod = import(basePath + '/core/style.store');`),
      importerDir: resolve(customRoot, 'stages/login'),
      customRoot,
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('forbidden-dynamic');
    expect(violations[0]?.specifier).toBe('<dynamic import>');
  });

  it('fails import.meta.glob closed', () => {
    const violations = checkCustomImports({
      imports: parseCustomImports(`const mods = import.meta.glob('../../core/*.ts');`),
      importerDir: resolve(customRoot, 'stages/login'),
      customRoot,
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('forbidden-dynamic');
    expect(violations[0]?.specifier).toBe('import.meta.glob(...)');
  });
});

describe('isExcludedFromCustomImports', () => {
  it('excludes the curated surface file (it re-exports internals by design)', () => {
    expect(isExcludedFromCustomImports('login-framework.ts')).toBe(true);
  });

  it('excludes Storybook story and mock files', () => {
    expect(isExcludedFromCustomImports('stages/login/login.stories.js')).toBe(true);
    expect(isExcludedFromCustomImports('stages/login/login.story.svelte')).toBe(true);
    expect(isExcludedFromCustomImports('stages/login/login.mock.ts')).toBe(true);
    expect(isExcludedFromCustomImports('callbacks/name/name.stories.ts')).toBe(true);
  });

  it('excludes test files and declarations', () => {
    expect(isExcludedFromCustomImports('stages/login/login.test.ts')).toBe(true);
    expect(isExcludedFromCustomImports('stages/login/login.d.ts')).toBe(true);
  });

  it('keeps production component and utility files', () => {
    expect(isExcludedFromCustomImports('layout/header.svelte')).toBe(false);
    expect(isExcludedFromCustomImports('stages/login/login.svelte')).toBe(false);
    expect(isExcludedFromCustomImports('stages/login/helpers.utilities.ts')).toBe(false);
    expect(isExcludedFromCustomImports('callbacks/name/name.ts')).toBe(false);
  });
});

describe('scanCustomComponents (real tree)', () => {
  it('finds zero violations in the checked-in custom/components/ tree', () => {
    const files = scanCustomComponents(projectRoot);
    expect(files).toEqual([]);
  });

  it('excluded files are not part of the scan (demo stories use internals legitimately)', () => {
    // The demo story files import $core/$journey directly; they compile only
    // inside Storybook. The scan must therefore cover only production files.
    const excludedFiles = [
      'custom/components/demo/callbacks/custom-name/custom-name.mock.ts',
      'custom/components/demo/callbacks/custom-name/custom-name.story.svelte',
      'custom/components/demo/stages/custom-login/custom-login.mock.ts',
      'custom/components/demo/stages/custom-login/custom-login.story.svelte',
    ];
    for (const file of excludedFiles) {
      expect(isExcludedFromCustomImports(file), file).toBe(true);
    }
    expect(isExcludedFromCustomImports('login-framework.ts')).toBe(true);
  });

  it('flags a forbidden import in a production file inside a fixture tree', () => {
    // Negative sweep fixture: a real file on disk with a forbidden import
    // must be caught by the scanner, not only by the pure checker.
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'custom-imports-'));
    try {
      mkdirSync(join(fixtureRoot, 'custom/components/stages/broken'), { recursive: true });
      writeFileSync(
        join(fixtureRoot, 'custom/components/stages/broken/broken.svelte'),
        `<script lang="ts">\n  import { styleStore } from '$core/style.store';\n</script>\n`,
      );
      const files = scanCustomComponents(fixtureRoot);
      expect(files).toHaveLength(1);
      expect(files[0]?.file).toContain('broken.svelte');
      expect(files[0]?.violations[0]?.kind).toBe('forbidden-alias');
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});
