/**
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * Tests for copyTypes.mjs's loud-failure contract: the script must exit
 * non-zero when the core declaration sources it copies are missing, instead
 * of silently producing a published tarball whose index.d.ts references
 * nonexistent ./core/* modules (F11). Runs the real script with the core
 * sources hidden behind a temporary rename.
 */

import { spawnSync } from 'child_process';
import { existsSync, renameSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..', '..', '..');
const coreDir = join(repoRoot, 'core');

const hiddenDirs = [];

beforeAll(() => {
  // Hide one real core .d.ts file so the copy loop reports a skip for it.
  // copyTypes copies the whole 12-file list each run; a single missing file
  // is the realistic partial-failure mode (declaration emit partially
  // failed upstream).
  const victim = join(coreDir, 'interfaces.d.ts');
  if (existsSync(victim)) {
    renameSync(victim, `${victim}.hidden`);
    hiddenDirs.push(victim);
  }
});

afterAll(() => {
  for (const victim of hiddenDirs) {
    renameSync(`${victim}.hidden`, victim);
  }
});

describe('copyTypes loud failure', () => {
  it('exits non-zero when a core declaration source is missing', () => {
    const result = spawnSync(process.execPath, [join(scriptDir, 'copyTypes.mjs')], {
      cwd: scriptDir,
      encoding: 'utf8',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/interfaces\.d\.ts/);
  });
});
