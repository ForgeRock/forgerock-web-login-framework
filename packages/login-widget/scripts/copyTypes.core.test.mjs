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
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const scriptSourcePath = join(dirname(fileURLToPath(import.meta.url)), 'copyTypes.mjs');

const widgetDeclarationFiles = [
  'index.svelte.d.ts',
  'types.d.ts',
  'interfaces.d.ts',
  'widget.config.d.ts',
];

// Mirrors coreFilesToCopy in copyTypes.mjs. If the script gains an entry, the
// success case below fails until this list is updated, which is intended.
const coreDeclarationFiles = [
  'interfaces.d.ts',
  'captcha.config.d.ts',
  'component.store.d.ts',
  'links.store.d.ts',
  'locale.store.d.ts',
  'style.store.d.ts',
  'oidc/oidc.store.d.ts',
  'oauth/oauth.store.d.ts',
  'user/user.store.d.ts',
  'protect/protect.store.d.ts',
  'journey/journey.interfaces.d.ts',
  'journey/config.store.d.ts',
];

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
