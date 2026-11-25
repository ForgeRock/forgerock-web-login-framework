/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import {
  checkCustomImports,
  isExcludedFromCustomImports,
  parseCustomImports,
} from './custom-imports';

/**
 * Vite plugin enforcing the customer-source import boundary
 * (`custom/components/`) at compile time, per the Custom Components public
 * API contract ("Prohibited imports"). Sibling of `customRegistry` (which
 * validates `@component` headers of the same files) and
 * `loginFrameworkDist` (which resolves the framework aliases): every
 * consumer build that compiles customer source — widget ESM, widget IIFE,
 * login-app, Storybook — installs it next to those plugins, so a forbidden
 * import fails the build with a named error instead of silently bundling
 * framework internals.
 *
 * The plugin runs `enforce: 'pre'` and checks on `load`: by then the
 * importer's real path is known, so the relative-escape rule works, and
 * every downstream resolution (including the alias resolvers) only sees
 * files that passed the boundary. Exempt files (stories, mocks, tests, the
 * curated surface itself) are skipped — see `isExcludedFromCustomImports`.
 *
 * Build tooling, colocated with the other consumer-side plugins and
 * excluded from the package build by `collect-entries.ts`.
 */

/** Options for {@link customImportBoundary}. */
interface CustomImportBoundaryOptions {
  /**
   * Absolute path to the project root that contains `custom/components/`
   * (consumers pass `resolve('../..')`, the same value `customRegistry`
   * receives as `projectRoot`).
   */
  projectRoot: string;
}

// Subset of vite's Plugin type this plugin fills in. Declared structurally
// so core/ doesn't import vite's types (same approach as the registry's
// customRegistry and loginFrameworkDist plugins).
interface BoundaryPlugin {
  name: string;
  enforce: 'pre';
  load(id: string): string | null;
}

/** Formats one violation as a compiler-style diagnostic line. */
const formatViolation = (file: string, kind: string, specifier: string, line: number): string =>
  `  ${file}:${line}: ${kind} — "${specifier}"`;

/** The subset of a violation the error message renders. */
interface ViolationSummary {
  readonly kind: string;
  readonly specifier: string;
  readonly line: number;
}

/**
 * The error thrown on the first violating file. Lists every violation in
 * that file so the customer fixes them in one edit, and names the two
 * allowed import forms.
 */
const boundaryError = (file: string, violations: readonly ViolationSummary[]): Error =>
  new Error(
    [
      `Custom component import boundary violated in ${file}.`,
      ...violations.map((violation) =>
        formatViolation(file, violation.kind, violation.specifier, violation.line),
      ),
      '',
      'Customer components may import only:',
      '  - the curated surface module ($login-framework),',
      '  - relative paths inside custom/components/ (or $custom/<path>),',
      '  - bare npm packages (e.g. svelte), and',
      '  - type-only imports from @forgerock/journey-client/types.',
      '',
      'Everything else ($core, $journey, $components, $locales, runtime',
      'journey-client imports, paths escaping custom/components/) is',
      'framework-internal and may change across widget upgrades. Import the',
      'curated surface instead — to request a new export, open a PR adding',
      'it to custom/components/login-framework.ts.',
    ].join('\n'),
  );

export function customImportBoundary({ projectRoot }: CustomImportBoundaryOptions): BoundaryPlugin {
  const customRoot = join(projectRoot, 'custom', 'components');

  return {
    name: 'framework-core:custom-import-boundary',
    enforce: 'pre',
    load(id: string) {
      // Vite ids may carry a query (?raw, ?inline) or a \0 virtual prefix;
      // the real file path precedes both.
      const filePath = id.startsWith('\0') ? '' : id.split('?')[0] ?? '';
      if (filePath === '' || !existsSync(filePath) || !statSync(filePath).isFile()) {
        return null;
      }
      const relativeToCustom = relative(customRoot, filePath);
      if (relativeToCustom.startsWith('..') || relativeToCustom === '') {
        return null;
      }
      if (isExcludedFromCustomImports(relativeToCustom)) {
        return null;
      }
      if (!/\.(ts|js|svelte)$/.test(relativeToCustom)) {
        return null;
      }
      const sourceText = readFileSync(filePath, 'utf8');
      const violations = checkCustomImports({
        imports: parseCustomImports(sourceText),
        importerDir: join(filePath, '..'),
        customRoot,
      });
      if (violations.length > 0) {
        throw boundaryError(relativeToCustom, violations);
      }
      return null;
    },
  };
}
