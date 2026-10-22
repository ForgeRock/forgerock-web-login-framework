import { svelte } from '@sveltejs/vite-plugin-svelte';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'path';
import { defineConfig } from 'vitest/config';

import { customRegistry } from '../../core/journey/_utilities/registry/vite-plugin';

// Same resolution logic as experimental/editor-poc/vite.config.ts — the
// journey-client mock imports the real callback factory through this
// exports-map-bypassing alias.
const journeyClientRealPath = (): string =>
  dirname(
    realpathSync(
      createRequire(resolve(__dirname, 'package.json')).resolve(
        '@forgerock/journey-client/package.json',
      ),
    ),
  );

function resolveJourneyClientFactoryPath(): string {
  return resolve(journeyClientRealPath(), 'dist/src/lib/callbacks/factory.js');
}

// pnpm's isolated layout hides @forgerock/sdk-types inside journey-client's
// .pnpm context — not resolvable from packages/login-widget. Resolve through
// journey-client's realpath (sibling under its .pnpm node_modules), mirroring
// experimental/editor-poc/vite.config.ts resolveSdkTypesPath().
function resolveSdkTypesPath(): string {
  return resolve(journeyClientRealPath(), '..', 'sdk-types');
}

// The main-entry alias to the PoC mock shadows the package's export map, so
// every subpath core/ imports must be re-pointed explicitly: the PoC stub
// files for webauthn/device/types (same targets the PoC's Vite config uses),
// and the REAL dist modules for the subpaths core/ uses that the PoC does not
// stub (qr-code, recovery-codes).
function resolveJourneyClientSubpath(subpath: string): string {
  return resolve(journeyClientRealPath(), `dist/src/lib/${subpath}`);
}

export default defineConfig({
  resolve: {
    // Array form (not object): object aliases prefix-match in insertion order,
    // so `@forgerock/journey-client` would swallow `@forgerock/journey-client/webauthn`.
    // Array entries match most-specific-first by listing order here.
    alias: [
      { find: '$core', replacement: resolve('../../core') },
      { find: '$components', replacement: resolve('../../core/components') },
      { find: '$journey', replacement: resolve('../../core/journey') },
      { find: '$locales', replacement: resolve('../../core/locales') },
      {
        find: '$login-framework',
        replacement: resolve('../../experimental/custom/login-framework.ts'),
      },
      // Subpaths first — the PoC stub files experimental/editor-poc/vite.config.ts
      // aliases, so the editor-poc preview tests exercise the same boundaries.
      {
        find: '@forgerock/journey-client/webauthn',
        replacement: resolve('../../experimental/editor-poc/src/framework-stubs/webauthn-stub.ts'),
      },
      {
        find: '@forgerock/journey-client/device',
        replacement: resolve('../../experimental/editor-poc/src/framework-stubs/device-stub.ts'),
      },
      {
        find: '@forgerock/journey-client/types',
        replacement: resolve(
          '../../experimental/editor-poc/src/framework-stubs/journey-client-types-shim.ts',
        ),
      },
      // Subpaths core/ uses that the PoC does not stub keep resolving to the
      // REAL dist modules (the main-entry alias shadows the export map).
      {
        find: '@forgerock/journey-client/qr-code',
        replacement: resolveJourneyClientSubpath('qr-code/qr-code.js'),
      },
      {
        find: '@forgerock/journey-client/recovery-codes',
        replacement: resolveJourneyClientSubpath('recovery-codes/recovery-codes.js'),
      },
      // Main entry last: the editor-poc preview tests
      // (experimental/editor-poc/src/preview-framework.test.ts) exercise the
      // widget runtime over the PoC's fixture-backed journey-client mock.
      // Without this, vitest resolves the real journey-client and configure()
      // fetches a wellknown URL over the network.
      {
        find: '@forgerock/journey-client',
        replacement: resolve(
          '../../experimental/editor-poc/src/framework-stubs/journey-client-mock.ts',
        ),
      },
      // The mock imports the real callback factory through the same
      // exports-map-bypassing alias the PoC's Vite config defines.
      { find: '#journey-client-factory', replacement: resolveJourneyClientFactoryPath() },
      // The mock re-exports the real callbackType enum; pnpm hides the
      // package inside journey-client's .pnpm context.
      { find: '@forgerock/sdk-types', replacement: resolveSdkTypesPath() },
    ],
  },
  plugins: [
    customRegistry({ projectRoot: resolve('../..') }),
    svelte({ hot: !process.env.VITEST }),
  ],
  test: {
    include: [
      resolve('../../core/**/*.test.ts'),
      resolve('../../experimental/custom/**/*.test.ts'),
      resolve('../../experimental/editor-poc/src/**/*.test.ts'),
      resolve('../../themes/**/*.test.ts'),
      resolve('./src/**/*.test.ts'),
    ],
    exclude: ['node_modules', 'dist'],
    typecheck: {
      tsconfig: './tsconfig.json',
    },
  },
});
