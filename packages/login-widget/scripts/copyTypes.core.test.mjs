/**
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * Tests for copyTypes.mjs's loud-failure contract: the script must exit
 * non-zero when the core declaration sources it copies are missing, instead
 * of silently producing a published tarball whose index.d.ts references
 * nonexistent ./core/* modules (F11). Hermetic: the script is copied into a
 * temporary repo tree with fake svelte-package output and a controlled core/
 * directory, so nothing in the real repo or real dist is read or written.
 */

import { spawnSync } from 'child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

import { CORE_TYPE_FILES, WIDGET_TYPE_FILES } from './copyTypes.mjs';

const scriptSourcePath = join(dirname(fileURLToPath(import.meta.url)), 'copyTypes.mjs');

const widgetDeclarationFiles = WIDGET_TYPE_FILES.map(({ src }) => src);

// Reuses the exported list from copyTypes.mjs (single source of truth). The
// loud-failure tests below still pass a static copy of the list so a
// regression in the export itself surfaces here.
const coreDeclarationFiles = [...CORE_TYPE_FILES];

const writeEmptyFile = (filePath) => {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, '');
};

/**
 * Builds <root>/packages/login-widget/{scripts,svelte-package} and <root>/core
 * so the copied script resolves rootDir and repoRoot inside the temp tree.
 */
const createFixtureTree = ({ coreFiles }) => {
  const root = mkdtempSync(join(tmpdir(), 'copy-types-'));
  const widgetDir = join(root, 'packages', 'login-widget');
  const scriptDir = join(widgetDir, 'scripts');
  mkdirSync(scriptDir, { recursive: true });
  mkdirSync(join(root, 'core'), { recursive: true });
  copyFileSync(scriptSourcePath, join(scriptDir, 'copyTypes.mjs'));
  widgetDeclarationFiles.forEach((fileName) =>
    writeEmptyFile(join(widgetDir, 'svelte-package', fileName)),
  );
  coreFiles.forEach((relPath) => writeEmptyFile(join(root, 'core', relPath)));
  return { root, widgetDir, scriptDir };
};

const runInFixtureTree = ({ coreFiles }, assertOutcome) => {
  const fixture = createFixtureTree({ coreFiles });
  try {
    const result = spawnSync(process.execPath, [join(fixture.scriptDir, 'copyTypes.mjs')], {
      cwd: fixture.scriptDir,
      encoding: 'utf8',
    });
    assertOutcome(result, fixture);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
};

describe('copyTypes loud failure', () => {
  it('exits non-zero and names every missing core declaration when core/ is empty', () => {
    runInFixtureTree({ coreFiles: [] }, (result) => {
      expect(result.status).toBe(1);
      // Proves the core loop ran: the widget copy guard did not trip first.
      expect(result.stderr).not.toContain('No type files were copied');
      coreDeclarationFiles.forEach((relPath) => {
        expect(result.stderr).toContain(`Missing core declaration: core/${relPath} not found`);
      });
      expect(result.stdout).toContain(
        `Core type copying: 0 copied, ${coreDeclarationFiles.length} missing`,
      );
    });
  });

  it('exits non-zero and names only the missing file when one core declaration is absent', () => {
    const missingRelPath = 'interfaces.d.ts';
    const presentFiles = coreDeclarationFiles.filter((relPath) => relPath !== missingRelPath);
    runInFixtureTree({ coreFiles: presentFiles }, (result) => {
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(`Missing core declaration: core/${missingRelPath} not found`);
      expect(result.stderr.match(/Missing core declaration/g)).toHaveLength(1);
      expect(result.stdout).toContain(
        `Core type copying: ${presentFiles.length} copied, 1 missing`,
      );
    });
  });

  it('exits zero and copies every core declaration into dist/core when all are present', () => {
    runInFixtureTree({ coreFiles: coreDeclarationFiles }, (result, fixture) => {
      expect(result.status).toBe(0);
      expect(result.stderr).not.toContain('Missing core declaration');
      coreDeclarationFiles.forEach((relPath) => {
        expect(existsSync(join(fixture.widgetDir, 'dist', 'core', relPath))).toBe(true);
      });
    });
  });
});

describe('core declaration closure', () => {
  // The published tarball only works when every core type module the widget
  // d.ts files reference (directly or transitively) is in CORE_TYPE_FILES:
  // the alias rewrite maps `$core/x` to `./core/x` in dist, and anything
  // outside the copied set ships as an unresolvable import (TS2307). The
  // closure is derived from the real svelte-package output, so a new alias
  // reference in the widget types fails here until the copy list gains the
  // file. Skipped when svelte-package has not run (fresh checkout, CI test
  // jobs); the release chain always runs it before copyTypes.mjs.
  const sveltePackageDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'svelte-package');

  const aliasSpecifiersIn = (text) =>
    Array.from(text.matchAll(/\$[a-z]+(?:\/[A-Za-z0-9._-]+)+/g), (m) => m[0]);

  const widgetTypeFiles = WIDGET_TYPE_FILES.map(({ src }) => join(sveltePackageDir, src));

  it.skipIf(widgetTypeFiles.some((filePath) => !existsSync(filePath)))(
    'covers every alias reference in the widget type declarations (transitive)',
    () => {
      // Both alias families are rewritten to ./core/* in the published dist
      // (processTypes.mjs maps $core/x to ./core/x and $journey/x to
      // ./core/journey/x), so a $journey reference needs journey/config.store.d.ts
      // in the copy list exactly like a $core one.
      const mapAliasToDts = (specifier) => {
        const corePrefix = specifier.startsWith('$core/') ? '$core/' : null;
        const journeyPrefix = specifier.startsWith('$journey/') ? '$journey/' : null;
        if (corePrefix) {
          return `${specifier.slice('$core/'.length)}.d.ts`;
        }
        if (journeyPrefix) {
          return `journey/${specifier.slice('$journey/'.length)}.d.ts`;
        }
        return null;
      };

      const referenced = new Set();
      const visited = new Set();
      const queue = widgetTypeFiles
        .filter((filePath) => existsSync(filePath))
        .flatMap((filePath) => aliasSpecifiersIn(readFileSync(filePath, 'utf8')))
        .map(mapAliasToDts)
        .filter(Boolean);

      // Transitive step: copied core d.ts files may themselves reference
      // further alias modules (e.g. oauth.store -> $core/interfaces,
      // oauth.store -> $core/oidc/oidc.store).
      while (queue.length > 0) {
        const relPath = queue.pop();
        if (visited.has(relPath)) {
          continue;
        }
        visited.add(relPath);
        referenced.add(relPath);
        const filePath = join(sveltePackageDir, '..', '..', '..', 'core', relPath);
        if (!existsSync(filePath)) {
          continue;
        }
        aliasSpecifiersIn(readFileSync(filePath, 'utf8'))
          .map(mapAliasToDts)
          .filter(Boolean)
          .forEach((next) => {
            if (!visited.has(next)) {
              queue.push(next);
            }
          });
      }
      const closure = [...referenced].sort();

      const missing = closure.filter((relPath) => !CORE_TYPE_FILES.includes(relPath));
      expect(
        missing,
        `widget types reference core declarations outside the copy list; ` +
          `add them to CORE_TYPE_FILES in copyTypes.mjs (and tsconfig.declarations.json)`,
      ).toEqual([]);
    },
  );

  it('keeps the tsconfig.declarations.json include list in sync with the copy list', () => {
    // The declaration build (tsconfig.declarations.json) and the copy
    // script (CORE_TYPE_FILES) must cover the same module set: a module in
    // one but not the other either is built but never shipped, or shipped
    // but never built.
    const tsconfigPath = join(
      dirname(fileURLToPath(import.meta.url)),
      '..',
      '..',
      '..',
      'core',
      'tsconfig.declarations.json',
    );
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
    const includeList = tsconfig.include.map((entry) => entry.replace(/\.ts$/, '.d.ts')).sort();
    expect(includeList).toEqual([...CORE_TYPE_FILES].sort());
  });
});
