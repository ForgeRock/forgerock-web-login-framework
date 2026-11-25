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
