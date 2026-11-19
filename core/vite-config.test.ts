/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { join, relative, resolve } from 'path';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';

import { isRuntimeModule, packageRoot, runtimeEntries } from './collect-entries';
import clientConfig from './vite.config';
import serverConfig from './vite.config.server';
import { packageCssConfig, packageSveltePluginOptions } from './vite-shared';

import type { UserConfig } from 'vite';

const centeredSource = resolve(packageRoot, 'components/primitives/box/centered.svelte');

/** Output files of a one-component build with the package's own plugin and CSS config. */
const buildCentered = async (ssr: boolean) => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [svelte(packageSveltePluginOptions())],
    css: packageCssConfig,
    build: {
      write: false,
      ssr,
      minify: false,
      lib: { entry: centeredSource, formats: ['es'], fileName: 'centered' },
      rollupOptions: { external: [/^svelte(\/|$)/] },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  return outputs.flatMap((output) => ('output' in output ? output.output : []));
};

/**
 * The package's two Vite builds (client tree, SSR tree) share one Svelte
 * plugin options factory. The plugin only accepts `configFile`, plugin
 * options (include, exclude, emitCss, ...) and root options (extensions,
 * compilerOptions, preprocess, onwarn); anything else triggers
 * "invalid plugin options" warnings at runtime. PostCSS is configured on
 * the Vite `css` level, not on the Svelte plugin.
 */
describe('package Vite build options', () => {
  it('Svelte plugin options carry no postcss key (dead option, warns at runtime)', () => {
    const options = packageSveltePluginOptions();
    expect(options).not.toHaveProperty('postcss');
  });

  it('Svelte plugin options disable the config file lookup', () => {
    const options = packageSveltePluginOptions();
    expect(options.configFile).toBe(false);
  });

  it('Svelte plugin options keep the componentApi 4 compatibility mode', () => {
    const options = packageSveltePluginOptions();
    expect(options.compilerOptions?.compatibility).toEqual({ componentApi: 4 });
  });

  it('CSS config runs an empty PostCSS pipeline (no Tailwind autodetect)', () => {
    expect(packageCssConfig).toEqual({ postcss: { plugins: [] } });
  });

  it.each([
    ['client', false],
    ['SSR', true],
  ])(
    'a component <style> block stays in the %s build output (self-contained, no consumer CSS import)',
    async (_label, ssr) => {
      const files = await buildCentered(ssr);
      const code = files.flatMap((file) => (file.type === 'chunk' ? [file.code] : []));
      const stylesheets = files.filter((file) => file.fileName.endsWith('.css'));
      expect(stylesheets).toEqual([]);
      expect(code.join('\n')).toContain('--fr-page-bg-image');
    },
  );

  it('build tooling modules are not part of the package build surface', () => {
    const entries = runtimeEntries.map((entry) => entry.split('/').slice(-1)[0]);
    for (const toolingModule of ['vite-shared.ts', 'vite-config.test.ts']) {
      expect(entries).not.toContain(toolingModule);
    }
  });

  it('test fixtures and the preset catalog built on them are not part of the package build surface', () => {
    const entries = runtimeEntries.map((entry) => relative(packageRoot, entry));
    const fixtureEntries = entries.filter(
      (entry) =>
        /\.mock\.(ts|js)$/.test(entry) ||
        entry === join('journey', 'callbacks', '_utilities', 'callback-presets.ts'),
    );
    expect(fixtureEntries).toEqual([join('journey', '_utilities', 'step.mock.ts')]);
  });

  it('the generated custom registry is never a runtime module (consumer-owned, source-resolved)', () => {
    expect(isRuntimeModule('journey/_utilities/registry/custom-registry.ts')).toBe(false);
    const entries = runtimeEntries.map((entry) =>
      relative(packageRoot, entry).replaceAll('\\', '/'),
    );
    expect(entries).not.toContain('journey/_utilities/registry/custom-registry.ts');
  });
});

/**
 * Builds the two modules that import the registry with each tree's real
 * config (plugins, aliases, externals), swapping only the entry list, so the
 * test stays small while the externalization under test is the shipped one.
 */
const buildRegistryImporters = async (config: UserConfig) => {
  const result = await build({
    ...config,
    configFile: false,
    logLevel: 'silent',
    build: {
      ...config.build,
      write: false,
      lib: {
        entry: [
          resolve(packageRoot, 'journey/_utilities/map-stage.utilities.ts'),
          resolve(packageRoot, 'journey/_utilities/callback-mapper.svelte'),
        ],
        formats: ['es'],
      },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  return outputs.flatMap((output) => ('output' in output ? output.output : []));
};

describe('custom registry in the package builds', () => {
  it.each([
    ['client', clientConfig],
    ['SSR', serverConfig],
  ])(
    'the %s tree imports the registry bare and emits no registry module',
    async (_label, config) => {
      const files = await buildRegistryImporters(config);
      const code = files.flatMap((file) => (file.type === 'chunk' ? [file.code] : []));
      expect(
        files.map((file) => file.fileName).filter((name) => /custom-registry/.test(name)),
      ).toEqual([]);
      const bareImport = /from\s*['"]\$journey\/_utilities\/registry\/custom-registry['"]/;
      expect(code.filter((chunk) => bareImport.test(chunk))).toHaveLength(2);
    },
    120_000,
  );
});
