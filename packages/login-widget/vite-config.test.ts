/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { build as viteBuild } from 'vite';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import appConfig from '../../apps/login-app/vite.config';
import { customImportBoundary } from '../../core/vite-plugin-custom-imports';
import { packageDedupe } from '../../core/vite-shared';
import esmConfig from './vite.config';
import iifeConfig from './vite.config.iife';

import type { Plugin, UserConfigExport } from 'vite';

// Captures the options each consumer config passes to customRegistry, so the
// wiring test can assert the widget configs exclude the e2e canary without
// depending on the plugin's internals. The mock stands in for the real
// plugin: nothing here runs a build that would regenerate the registry.
const { customRegistryCalls } = vi.hoisted(() => ({
  customRegistryCalls: [] as Array<{ projectRoot: string; exclude?: readonly string[] }>,
}));

vi.mock('../../core/journey/_utilities/registry/vite-plugin', () => ({
  customRegistry: (options: { projectRoot: string; exclude?: readonly string[] }) => {
    customRegistryCalls.push(options);
    return { name: 'framework-core:custom-registry', buildStart: () => undefined };
  },
}));

// sveltekit() loads the app's svelte.config.js, which pulls a second copy of
// svelte-preprocess into the process; the dedupe assertion needs only the config shape.
// The path is the app's own resolution of '@sveltejs/kit/vite': a bare specifier would
// resolve from this package, where kit is not installed, and miss the app config's import.
vi.mock('../../apps/login-app/node_modules/@sveltejs/kit/src/exports/vite/index.js', () => ({
  sveltekit: () => [],
}));

/** Flattens a config's plugin list (plugins may nest) into plugin objects. */
const flattenPlugins = (config: UserConfigExport): readonly Plugin[] => {
  const resolved =
    typeof config === 'function' ? config({ command: 'build', mode: 'production' }) : config;
  const plugins = resolved.plugins ?? [];
  return plugins
    .flat()
    .filter((plugin): plugin is Plugin => plugin !== null && typeof plugin === 'object');
};

describe('widget ESM build bundling', () => {
  const rollupOptions = esmConfig.build?.rollupOptions;
  const output = Array.isArray(rollupOptions?.output)
    ? rollupOptions?.output[0]
    : rollupOptions?.output;

  it('bundles the framework-core dist into the widget output (no external)', () => {
    // `framework-core` is a private workspace package that is never published:
    // emitted `framework-core/dist/...` imports could not resolve on an npm
    // consumer's machine, so the ESM build must inline the framework.
    expect(rollupOptions?.external).toBeUndefined();
  });

  it('emits no framework-core specifier rewrite (output paths absent)', () => {
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

  it('declares no framework-core dependency (private package, bundled)', () => {
    const manifest = readPackageManifest();
    expect(Object.keys(manifest.dependencies ?? {})).not.toContain('framework-core');
    expect(Object.keys(manifest.peerDependencies ?? {})).not.toContain('framework-core');
  });

  it('built ESM artifact holds zero framework-core specifiers (post-build guard)', () => {
    // Config-level checks above prove intent; this proves the artifact.
    // dist/index.js is gitignored build output: skipped when unbuilt (fresh
    // checkouts, the CI test job). The CI build job runs build:release but
    // not the vitest suite, so the guard bites on local and release builds
    // run via `pnpm test` after a build, not in CI. `framework-core` is a
    // private workspace package; a single emitted specifier would be
    // unresolvable on an npm consumer's machine (F1's original defect).
    const artifact = resolve(import.meta.dirname, 'dist/index.js');
    if (!existsSync(artifact)) {
      return;
    }
    const code = readFileSync(artifact, 'utf8');
    // Specifier boundary: a quote or the start of `framework-core/dist/`
    // or `framework-core/...` import paths. `framework-core-surface` as a
    // substring of an unrelated identifier would not be a module specifier.
    expect(
      code.match(/['"]framework-core\//) ?? code.match(/^import\s+['"]framework-core['"]/m),
    ).toBeNull();
  });
});

describe('widget build wiring (F71 guard)', () => {
  // Both published builds must enforce the customer import boundary and pass
  // the published registry excludes to customRegistry: deleting either from
  // one config would ship framework internals or the e2e canary stage with
  // CI green.
  const BOUNDARY_PLUGIN_NAME = 'framework-core:custom-import-boundary';

  // Exactly three configs are imported at the top of this file, each calling
  // customRegistry once (two widget configs, the login-app), so the captured
  // options are countable and unambiguous without module re-import games.
  const excludingCalls = () =>
    customRegistryCalls.filter((options) => (options.exclude ?? []).includes('stages/e2e-canary'));

  it.each([
    ['ESM', esmConfig],
    ['IIFE', iifeConfig],
  ])('the %s config installs the customImportBoundary plugin', (_label, config) => {
    expect(flattenPlugins(config).some((plugin) => plugin.name === BOUNDARY_PLUGIN_NAME)).toBe(
      true,
    );
  });

  it('both widget configs pass the published excludes to customRegistry', () => {
    expect(excludingCalls()).toHaveLength(2);
    expect(excludingCalls()[0]?.exclude).toContain('stages/e2e-canary');
    expect(excludingCalls()[1]?.exclude).toContain('stages/e2e-canary');
  });

  it('the login-app config registers every custom component (no published excludes)', async () => {
    // Contrast case: the app (and Storybook) register the canary so its e2e
    // suite can drive it; only the published widget builds exclude it. The
    // app config is a function, so its customRegistry call fires on
    // resolution; the delta around this invocation isolates this config's
    // call from any other config's (test order must not matter).
    const callsBefore = customRegistryCalls.length;
    const resolvedAppConfig =
      typeof appConfig === 'function'
        ? appConfig({ command: 'build', mode: 'production' })
        : appConfig;
    expect(resolvedAppConfig).toBeDefined();
    expect(customRegistryCalls.slice(callsBefore)).toEqual([
      { projectRoot: resolve(import.meta.dirname, '../..') },
    ]);
  });
});

describe('published dist artifact guard (F71)', () => {
  // dist/ is gitignored build output: the assertions run only when the build
  // exists (CI's test job runs this file after build:widget, so the guard
  // bites there). Guards against the registry exclude or the boundary plugin
  // being dropped from a widget config without a test noticing.
  const distDir = resolve(import.meta.dirname, 'dist');
  const artifacts = ['index.js', 'widget.iife.js'] as const;

  it.each(artifacts)('dist/%s is built without the E2eCanaryStage canary', (artifactName) => {
    const artifact = resolve(distDir, artifactName);
    if (!existsSync(artifact)) {
      return;
    }
    expect(readFileSync(artifact, 'utf8')).not.toContain('E2eCanaryStage');
  });
});

describe('custom import boundary rejects a forbidden import in a real Vite build', () => {
  // A minimal fixture project built with the actual plugin: an entry that
  // imports a customer file importing `$core`, which the boundary must fail.
  // The fixture is plain JS with a local `$core` alias stub, so without the
  // plugin the build SUCCEEDS (the assertion then fails, proving the test
  // bites) and with the plugin it throws naming the file and the specifier.
  // No Svelte plugin: a .svelte fixture could not compile at all, and the
  // build would fail for the wrong reason (vacuous pass).
  const fixtureBase = join(tmpdir(), 'login-widget-boundary-fixture');
  let fixtureRoot = '';

  beforeAll(() => {
    rmSync(fixtureBase, { recursive: true, force: true });
    mkdirSync(fixtureBase, { recursive: true });
    // macOS exposes tmpdir as a /var -> /private/var symlink, and Vite
    // resolves module ids through realpath: the projectRoot handed to the
    // plugin must be the real path, or the boundary would classify every
    // fixture file as outside custom/components and never check it.
    fixtureRoot = realpathSync(fixtureBase);
    const frameworkStub = join(fixtureRoot, 'framework/style.store.js');
    mkdirSync(join(frameworkStub, '..'), { recursive: true });
    writeFileSync(frameworkStub, 'export default "style";\n');
    const customerFile = join(fixtureRoot, 'custom/components/stages/violating/violating.js');
    mkdirSync(join(customerFile, '..'), { recursive: true });
    writeFileSync(
      customerFile,
      'import style from "$core/style.store";\n\nexport default style;\n',
    );
    writeFileSync(
      join(fixtureRoot, 'entry.js'),
      'export { default } from "./custom/components/stages/violating/violating.js";\n',
    );
  });

  afterAll(() => {
    rmSync(fixtureBase, { recursive: true, force: true });
  });

  const buildFixture = () =>
    viteBuild({
      configFile: false,
      root: fixtureRoot,
      logLevel: 'silent',
      plugins: [customImportBoundary({ projectRoot: fixtureRoot })],
      resolve: {
        alias: { $core: join(fixtureRoot, 'framework') },
      },
      build: {
        write: false,
        rollupOptions: { input: join(fixtureRoot, 'entry.js') },
      },
    });

  it('fails the build naming the violating file and specifier', async () => {
    const buildPromise = buildFixture();
    await expect(buildPromise).rejects.toThrow(/violating\.js/);
    await expect(buildPromise).rejects.toThrow(/\$core\/style\.store/);
  }, 30_000);
});

/**
 * Specifiers in the consumer manifests for the shared deps. The dep list
 * itself is `packageDedupe` in `core/vite-shared.ts` — the single source the
 * three consumer configs spread into `resolve.dedupe` and this file iterates.
 */
const SHARED_SPECIFIERS: Readonly<Record<string, string>> = {
  svelte: '^5.55.7',
  '@forgerock/journey-client': '^2.3.1',
  '@forgerock/oidc-client': '^2.3.1',
  '@forgerock/protect': '^2.3.1',
  '@forgerock/storage': '^2.3.1',
};

describe('single runtime, one copy per shared dependency', () => {
  const repoRoot = resolve(import.meta.dirname, '../..');
  const lockfile = readFileSync(resolve(repoRoot, 'pnpm-lock.yaml'), 'utf8');

  const lockfileSection = (startMarker: string, endMarker: string): string =>
    lockfile.slice(lockfile.indexOf(startMarker), lockfile.indexOf(endMarker));

  const uniqueMatches = (text: string, pattern: RegExp): ReadonlyArray<string> =>
    Array.from(new Set(Array.from(text.matchAll(pattern), (match) => match[1])));

  const resolveConfig = async (config: UserConfigExport) =>
    typeof config === 'function' ? config({ command: 'build', mode: 'production' }) : config;

  // pnpm lockfile v9 nests every importer dependency at the same 6/8-space
  // indentation, so one pattern per shared dep covers all workspaces. The
  // lookbehind plus exact indent anchors the key at line start, so `svelte`
  // does not also match `eslint-plugin-svelte`; scoped names need quotes in
  // the YAML, bare names do not.
  const importerPattern = (dep: string): RegExp =>
    new RegExp(
      `(?<=\\n)      ${dep.startsWith('@') ? "'" : ''}${dep}${
        dep.startsWith('@') ? "'" : ''
      }:\\n {8}specifier: (.+)\\n {8}version: (\\S+)`,
      'g',
    );

  it.each(packageDedupe)(`dedupes %s in the widget ESM config`, (dep) => {
    expect(esmConfig.resolve?.dedupe).toContain(dep);
  });

  it.each(packageDedupe)(`dedupes %s in the widget IIFE config`, (dep) => {
    expect(iifeConfig.resolve?.dedupe).toContain(dep);
  });

  it.each(packageDedupe)(`dedupes %s in the login-app config`, async (dep) => {
    const appResolved = await resolveConfig(appConfig);
    expect(appResolved.resolve?.dedupe).toContain(dep);
  });

  it.each(packageDedupe)('locks one %s specifier and version across every importer', (dep) => {
    const importers = lockfileSection('\nimporters:', '\npackages:');
    const pairs = Array.from(importers.matchAll(importerPattern(dep)), (m) => `${m[1]} -> ${m[2]}`);
    expect(Array.from(new Set(pairs))).toHaveLength(1);
  });

  it.each(packageDedupe)('locks a single %s package version', (dep) => {
    const packages = lockfileSection('\npackages:', '\nsnapshots:');
    // Scoped keys are quoted in the YAML with the quote before the closing
    // colon (`'@forgerock/x@1.2.3':`), so the capture spans the version plus
    // a possible trailing quote and is stripped after the match; bare keys
    // have no quote.
    expect(
      uniqueMatches(
        packages,
        new RegExp(
          `\\n {2}${dep.startsWith('@') ? "'" : ''}${dep.replace('/', '\\/')}@([^:]+):\\n`,
          'g',
        ),
      ).map((version) => version.replace(/'$/, '')),
    ).toHaveLength(1);
  });

  it('declares the shared specifier in every workspace manifest', () => {
    const importers = lockfileSection('\nimporters:', '\npackages:');
    for (const dep of packageDedupe) {
      expect(uniqueMatches(importers, importerPattern(dep))).toEqual([SHARED_SPECIFIERS[dep]]);
    }
  });
});
