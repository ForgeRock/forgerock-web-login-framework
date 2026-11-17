/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it } from 'vitest';

import { runtimeEntries } from './collect-entries';
import { packageCssConfig, packageSveltePluginOptions } from './vite-shared';

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

  it('build tooling modules are not part of the package build surface', () => {
    const entries = runtimeEntries.map((entry) => entry.split('/').slice(-1)[0]);
    for (const toolingModule of ['vite-shared.ts', 'vite-config.test.ts']) {
      expect(entries).not.toContain(toolingModule);
    }
  });
});
