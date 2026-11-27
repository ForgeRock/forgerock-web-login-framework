/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loginFrameworkDist } from './vite-plugin-dist';

/**
 * The plugin only checks file existence on the mapped dist paths, so the
 * resolver contract is tested against a sandbox fixture tree instead of the
 * real build output. This keeps the tests independent of whether `core/`
 * has been built (fresh checkouts, CI test jobs) while still exercising
 * the emitted-name reconciliation rules (.ts → .js, .svelte →
 * .component.js, .json → .json.js) against real files.
 */
const sandboxRoot = join(tmpdir(), 'framework-core-dist-fixture');

const distDir = join(sandboxRoot, 'dist');
const serverDistDir = join(sandboxRoot, 'dist-server');

/** Empty file paths that mirror the real build's emitted names. */
const fixtureFiles = [
  'dist/_utilities/i18n.utilities.js',
  'dist/components/primitives/text/text.component.js',
  'dist/locales/us/en/index.json.js',
  'dist-server/_utilities/i18n.utilities.js',
  'dist-server/components/primitives/text/text.component.js',
  'journey/_utilities/registry/custom-registry.ts',
];

beforeAll(() => {
  rmSync(sandboxRoot, { recursive: true, force: true });
  for (const relativePath of fixtureFiles) {
    const absolutePath = join(sandboxRoot, relativePath);
    mkdirSync(join(absolutePath, '..'), { recursive: true });
    writeFileSync(absolutePath, '');
  }
});

afterAll(() => {
  rmSync(sandboxRoot, { recursive: true, force: true });
});

const plugin = loginFrameworkDist({ packageDir: sandboxRoot });
const resolveId = (source: string) => plugin.resolveId(source, undefined);
const resolveIdSsr = (source: string) => plugin.resolveId(source, undefined, { ssr: true });

describe('loginFrameworkDist', () => {
  it('maps an extensionless TS module onto its dist JS file', () => {
    const resolved = resolveId('$core/_utilities/i18n.utilities');
    expect(resolved).toBe(resolve(distDir, '_utilities/i18n.utilities.js'));
  });

  it('maps a compiled Svelte component onto its .component.js dist file', () => {
    const resolved = resolveId('$components/primitives/text/text.svelte');
    expect(resolved).toBe(resolve(distDir, 'components/primitives/text/text.component.js'));
  });

  it('maps a JSON locale catalog onto its .json.js dist file', () => {
    const resolved = resolveId('$locales/us/en/index.json');
    expect(resolved).toBe(resolve(distDir, 'locales/us/en/index.json.js'));
  });

  it('returns null for a source module that is not part of the package build', () => {
    // `constants.ts` is excluded from the package build (SvelteKit-only
    // imports); the consumer must resolve it through its own alias.
    expect(resolveId('$core/constants')).toBeNull();
  });

  it('returns null for an alias pointing at a directory in dist', () => {
    // A directory (e.g. `dist/components`) exists on disk but is not a
    // module: resolving it would hand Rollup a directory path and fail
    // opaquely. The plugin must return null so the consumer's own
    // resolution (or a clear bare-specifier error) applies.
    mkdirSync(join(distDir, 'some-dir'), { recursive: true });
    expect(resolveId('$core/some-dir')).toBeNull();
  });

  it('resolves an explicit .ts specifier only when its emitted .js exists', () => {
    // A specifier that already ends in `.ts` (e.g. `$core/foo.ts`) must not
    // silently fall back to source: the fallback would compile the source
    // file a second time alongside the dist module (duplicate module
    // state). Without an emitted JS file it returns null; with one it maps
    // onto the emitted file.
    writeFileSync(join(distDir, 'typed-module.ts'), '');
    expect(resolveId('$core/typed-module.ts')).toBeNull();
    writeFileSync(join(distDir, 'typed-module.js'), '');
    expect(resolveId('$core/typed-module.ts')).toBe(resolve(distDir, 'typed-module.js'));
  });

  it('returns null for sources outside the package aliases', () => {
    expect(resolveId('./sibling.svelte')).toBeNull();
    expect(resolveId('$app-locales/us/en')).toBeNull();
  });

  describe('missing build output', () => {
    const unbuiltRoot = join(tmpdir(), 'framework-core-dist-unbuilt');
    const unbuiltPlugin = loginFrameworkDist({ packageDir: unbuiltRoot });

    // Only the client tree exists, so SSR resolutions find no server tree.
    const clientOnlyRoot = join(tmpdir(), 'framework-core-dist-client-only');
    const clientOnlyPlugin = loginFrameworkDist({ packageDir: clientOnlyRoot });

    beforeAll(() => {
      rmSync(unbuiltRoot, { recursive: true, force: true });
      rmSync(clientOnlyRoot, { recursive: true, force: true });
      mkdirSync(join(clientOnlyRoot, 'dist'), { recursive: true });
    });

    afterAll(() => {
      rmSync(unbuiltRoot, { recursive: true, force: true });
      rmSync(clientOnlyRoot, { recursive: true, force: true });
    });

    it.each([
      '$core/style.store',
      '$components/primitives/text/text.svelte',
      '$journey/journey.store',
      '$locales/us/en/index.json',
      '$core',
    ])(
      'tells the user to run pnpm build:framework-core when %s is imported and dist is absent',
      (source) => {
        expect(() => unbuiltPlugin.resolveId(source, undefined)).toThrow(
          /pnpm build:framework-core/,
        );
        expect(() => unbuiltPlugin.resolveId(source, undefined)).toThrow(
          new RegExp(source.replace(/[$.]/g, '\\$&')),
        );
      },
    );

    it('names the missing tree in the message', () => {
      expect(() => unbuiltPlugin.resolveId('$core/style.store', undefined)).toThrow(
        resolve(unbuiltRoot, 'dist'),
      );
    });

    it('requires dist-server for SSR resolutions', () => {
      expect(() => unbuiltPlugin.resolveId('$core/style.store', undefined, { ssr: true })).toThrow(
        resolve(unbuiltRoot, 'dist-server'),
      );
      expect(() =>
        clientOnlyPlugin.resolveId('$core/style.store', undefined, { ssr: true }),
      ).toThrow(/pnpm build:framework-core/);
    });

    it('does not throw for the client tree when only dist-server is missing', () => {
      expect(clientOnlyPlugin.resolveId('$core/constants', undefined)).toBeNull();
    });

    it('does not throw for sources outside the package aliases', () => {
      expect(unbuiltPlugin.resolveId('./sibling.svelte', undefined)).toBeNull();
      expect(unbuiltPlugin.resolveId('svelte/store', undefined)).toBeNull();
      expect(unbuiltPlugin.resolveId('\0virtual:module', undefined)).toBeNull();
    });
  });

  describe('SSR resolution', () => {
    it('maps a compiled Svelte component onto the server dist file', () => {
      const resolved = resolveIdSsr('$components/primitives/text/text.svelte');
      expect(resolved).toBe(resolve(serverDistDir, 'components/primitives/text/text.component.js'));
    });

    it('maps a plain TS module onto the server dist file', () => {
      const resolved = resolveIdSsr('$core/_utilities/i18n.utilities');
      expect(resolved).toBe(resolve(serverDistDir, '_utilities/i18n.utilities.js'));
    });

    it('returns null for a source module that is not part of the package build', () => {
      expect(resolveIdSsr('$core/constants')).toBeNull();
    });
  });

  describe('custom registry specifier', () => {
    const registrySpecifier = '$journey/_utilities/registry/custom-registry';
    const registrySource = resolve(sandboxRoot, 'journey/_utilities/registry/custom-registry.ts');

    // Neither tree exists and no registry file was generated.
    const registryMissingRoot = join(tmpdir(), 'framework-core-dist-registry-missing');
    const registryMissingPlugin = loginFrameworkDist({ packageDir: registryMissingRoot });

    beforeAll(() => {
      rmSync(registryMissingRoot, { recursive: true, force: true });
    });

    it('maps the registry specifier onto the source file for client resolutions', () => {
      expect(resolveId(registrySpecifier)).toBe(registrySource);
    });

    it('maps the registry specifier onto the source file for SSR resolutions', () => {
      expect(resolveIdSsr(registrySpecifier)).toBe(registrySource);
    });

    it('resolves the registry from source even when the built trees are absent', () => {
      const sourceOnlyRoot = join(tmpdir(), 'framework-core-dist-source-only');
      const registryFile = join(sourceOnlyRoot, 'journey/_utilities/registry/custom-registry.ts');
      rmSync(sourceOnlyRoot, { recursive: true, force: true });
      mkdirSync(join(registryFile, '..'), { recursive: true });
      writeFileSync(registryFile, '');
      const sourceOnlyPlugin = loginFrameworkDist({ packageDir: sourceOnlyRoot });
      try {
        expect(sourceOnlyPlugin.resolveId(registrySpecifier, undefined)).toBe(
          resolve(sourceOnlyRoot, 'journey/_utilities/registry/custom-registry.ts'),
        );
        expect(sourceOnlyPlugin.resolveId(registrySpecifier, undefined, { ssr: true })).toBe(
          resolve(sourceOnlyRoot, 'journey/_utilities/registry/custom-registry.ts'),
        );
      } finally {
        rmSync(sourceOnlyRoot, { recursive: true, force: true });
      }
    });

    it.each([
      ['client', undefined],
      ['SSR', { ssr: true }],
    ])('names the customRegistry plugin when the file is absent (%s)', (_label, options) => {
      expect(() => registryMissingPlugin.resolveId(registrySpecifier, undefined, options)).toThrow(
        /customRegistry/,
      );
      expect(() => registryMissingPlugin.resolveId(registrySpecifier, undefined, options)).toThrow(
        resolve(registryMissingRoot, 'journey/_utilities/registry/custom-registry.ts'),
      );
      expect(() =>
        registryMissingPlugin.resolveId(registrySpecifier, undefined, options),
      ).not.toThrow(/pnpm build:framework-core/);
    });

    it('does not treat a specifier that merely shares the registry prefix as the registry', () => {
      expect(resolveId('$journey/_utilities/registry/custom-registry-extra')).toBeNull();
    });

    it('keeps mapping every other alias onto dist', () => {
      expect(resolveId('$core/_utilities/i18n.utilities')).toBe(
        resolve(distDir, '_utilities/i18n.utilities.js'),
      );
    });
  });
});
