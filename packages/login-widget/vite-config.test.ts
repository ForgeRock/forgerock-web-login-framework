/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

import esmConfig from './vite.config';

describe('widget ESM build bundling', () => {
  const rollupOptions = esmConfig.build?.rollupOptions;
  const output = Array.isArray(rollupOptions?.output)
    ? rollupOptions?.output[0]
    : rollupOptions?.output;

  it('bundles the login-framework dist into the widget output (no external)', () => {
    // `login-framework` is a private workspace package that is never published:
    // emitted `login-framework/dist/...` imports could not resolve on an npm
    // consumer's machine, so the ESM build must inline the framework.
    expect(rollupOptions?.external).toBeUndefined();
  });

  it('emits no login-framework specifier rewrite (output paths absent)', () => {
    expect(output?.paths).toBeUndefined();
  });
});

describe('widget runtime dependencies', () => {
  function readPackageManifest(): {
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  } {
    return JSON.parse(readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf8'));
  }

  it('declares no login-framework dependency (private package, bundled)', () => {
    const manifest = readPackageManifest();
    expect(Object.keys(manifest.dependencies ?? {})).not.toContain('login-framework');
    expect(Object.keys(manifest.peerDependencies ?? {})).not.toContain('login-framework');
  });
});
