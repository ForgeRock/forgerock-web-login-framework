/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { readFileSync } from 'fs';

import { runtimeEntries } from './collect-entries';

/**
 * Import-surface parity check for the curated custom-component surface
 * (`experimental/custom/login-framework.ts`), per the Custom Components
 * public API contract ("Prohibited imports"):
 *
 *   Customer components must not import `$core`, `$journey`, `$components`,
 *   stores, callback or stage mappers, registries, server code, internal
 *   effects, or Storybook helpers. The custom-component compiler and CI
 *   enforce this with an import allowlist and compile-fail fixtures.
 *
 * The curated surface file is that allowlist: it is the one module customer
 * source imports from, so every re-export it declares must point inside the
 * package's runtime surface (the exact module set the package build
 * compiles, per `collect-entries.ts`), every export must be explicitly
 * named (no wildcards, so no export enters the surface without a
 * reviewable line), and external packages are limited to the reviewed
 * type-only Journey Client contract. Runtime re-exports of package modules
 * are the supported primitives; the surface never reaches outside the
 * package for runtime values.
 *
 * Build tooling, colocated with `vite-plugin-dist.ts` and excluded from the
 * package build by `collect-entries.ts`.
 */

/** One re-export (or local declaration) found in a surface file. */
export interface SurfaceExport {
  /** Exported names; empty for a wildcard re-export. */
  readonly names: readonly string[];
  /**
   * Module the names come from: an alias specifier, a bare package
   * specifier, or `null` for a local declaration.
   */
  readonly source: string | null;
  /** `true` for `export type { ... }` and `export interface/type`. */
  readonly typeOnly: boolean;
}

/** Why a surface export fails the parity check. */
export type SurfaceViolationKind =
  | 'wildcard-export'
  | 'forbidden-external'
  | 'source-outside-surface';

/** A parity-check failure, with the offending export names. */
export interface SurfaceViolation {
  readonly kind: SurfaceViolationKind;
  readonly names: readonly string[];
  readonly source: string | null;
}

/** A parsed surface file. */
export type SurfaceModule = readonly SurfaceExport[];

/**
 * Bare package specifiers allowed as re-export sources. Only type-only
 * re-exports are accepted from them (the Journey Client types contract).
 */
const ALLOWED_EXTERNAL_TYPES: ReadonlySet<string> = new Set(['@forgerock/journey-client/types']);

/** Alias roots the curated surface may re-export from. */
const ALIAS_ROOTS: ReadonlyArray<readonly [prefix: string, subPath: string]> = [
  ['$core', ''],
  ['$components', 'components'],
  ['$journey', 'journey'],
  ['$locales', 'locales'],
];

/**
 * Strips block, JSDoc and line comments so commented-out examples are not
 * parsed. One alternation pass, so a `/*` inside a line comment cannot
 * swallow the code that follows it.
 */
const stripComments = (text: string): string => text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');

/**
 * Matches one export statement of the surface file's reviewed forms:
 * `export [type] { names } from 'source'`, `export * [as name] from
 * 'source'`, and local `export interface Name` / `export type Name`.
 */
const EXPORT_STATEMENT =
  /export\s+(type\s+)?(\{[^}]*\}|\*(?:\s+as\s+\w+)?)\s*(?:from\s*['"]([^'"]+)['"])?;?|export\s+(?:interface|type)\s+(\w+)/g;

/**
 * Matches one import statement with bindings: `import [type] [Default]
 * [, { named } | * as ns] from 'source'`. Side-effect imports bind nothing
 * and are not matched.
 */
const IMPORT_STATEMENT =
  /import\s+(type\s+)?([\w$]+)?\s*,?\s*(\{[^}]*\}|\*\s+as\s+[\w$]+)?\s*from\s*['"]([^'"]+)['"]/g;

/**
 * One `{ [type] name [as alias] }` entry of an import or export clause.
 * `alias` is the name the entry introduces: the local binding for an import,
 * the exported name for an export. It equals `name` when there is no `as`.
 */
interface ClauseEntry {
  readonly name: string;
  readonly alias: string;
  readonly typeOnly: boolean;
}

/** Where a locally bound name was imported from. */
interface ImportBinding {
  readonly source: string;
  readonly typeOnly: boolean;
}

/** Parses the entries of a `{ ... }` clause. */
const parseClauseEntries = (clause: string): readonly ClauseEntry[] =>
  clause
    .slice(1, -1)
    .split(',')
    .flatMap((entry): ClauseEntry[] => {
      const match = entry.trim().match(/^(type\s+)?([\w$]+)(?:\s+as\s+([\w$]+))?$/);
      return match?.[2] === undefined
        ? []
        : [{ name: match[2], alias: match[3] ?? match[2], typeOnly: match[1] !== undefined }];
    });

/** Extracts the exported identifiers from a `{ ... }` clause. */
const parseExportNames = (clause: string): readonly string[] =>
  parseClauseEntries(clause).map((entry) => entry.alias);

/** Maps every locally bound import name to its import source. */
const parseImportBindings = (text: string): ReadonlyMap<string, ImportBinding> =>
  new Map(
    [...text.matchAll(IMPORT_STATEMENT)].flatMap(
      ([, typeKeyword, defaultName, clause, source]): ReadonlyArray<[string, ImportBinding]> => {
        const importTypeOnly = typeKeyword !== undefined;
        const defaultBinding: ReadonlyArray<[string, ImportBinding]> =
          defaultName === undefined || source === undefined
            ? []
            : [[defaultName, { source, typeOnly: importTypeOnly }]];
        const clauseBindings: ReadonlyArray<[string, ImportBinding]> =
          clause === undefined || source === undefined
            ? []
            : clause.startsWith('{')
            ? parseClauseEntries(clause).map((entry): [string, ImportBinding] => [
                entry.alias,
                { source, typeOnly: importTypeOnly || entry.typeOnly },
              ])
            : [[clause.replace(/^\*\s+as\s+/, ''), { source, typeOnly: importTypeOnly }]];
        return [...defaultBinding, ...clauseBindings];
      },
    ),
  );

/**
 * Expands a local `export { ... }` clause (no `from`) into one export per
 * name. A name bound by an import takes that import's source, so
 * `import { x } from 'pkg'; export { x }` is judged like
 * `export { x } from 'pkg'`; a name declared in the file stays local.
 */
const resolveLocalClause = ({
  clause,
  exportTypeOnly,
  importBindings,
}: {
  clause: string;
  exportTypeOnly: boolean;
  importBindings: ReadonlyMap<string, ImportBinding>;
}): readonly SurfaceExport[] =>
  parseClauseEntries(clause).map((entry): SurfaceExport => {
    const binding = importBindings.get(entry.name);
    return {
      names: [entry.alias],
      source: binding?.source ?? null,
      typeOnly: exportTypeOnly || entry.typeOnly || (binding?.typeOnly ?? false),
    };
  });

/**
 * Parses the export statements of a surface file into typed exports.
 *
 * Pure text analysis of the curated-surface file's reviewed statement
 * forms only. Comments are stripped first, and a local `export { x }` of
 * an imported name resolves to that import's source so it cannot bypass
 * the allowlist. The file is lint-formatted and reviewed, so a statement
 * this parser misses stays invisible here; the real-file test guards
 * against drift by asserting the parsed export count stays at the
 * reviewed baseline.
 */
export const parseSurface = (sourceText: string): SurfaceModule => {
  const withoutComments = stripComments(sourceText);
  const importBindings = parseImportBindings(withoutComments);

  return [...withoutComments.matchAll(EXPORT_STATEMENT)].flatMap(
    ([, typeKeyword, clause, source, localName]): readonly SurfaceExport[] => {
      if (localName !== undefined) {
        return [{ names: [localName], source: null, typeOnly: true }];
      }
      if (clause === undefined) {
        return [];
      }
      if (clause.startsWith('*')) {
        return [{ names: [], source: source ?? null, typeOnly: typeKeyword !== undefined }];
      }
      return source === undefined
        ? resolveLocalClause({
            clause,
            exportTypeOnly: typeKeyword !== undefined,
            importBindings,
          })
        : [{ names: parseExportNames(clause), source, typeOnly: typeKeyword !== undefined }];
    },
  );
};

/**
 * Checks a parsed surface against the package's runtime module set. Pure.
 *
 * @param surface parsed surface exports
 * @param runtimeModules alias specifiers (e.g. `$core/style.store`) the
 *   package build compiles, per `collect-entries.ts`
 */
export const checkSurface = ({
  surface,
  runtimeModules,
}: {
  surface: SurfaceModule;
  runtimeModules: ReadonlySet<string>;
}): readonly SurfaceViolation[] =>
  surface.flatMap((surfaceExport): SurfaceViolation[] => {
    if (surfaceExport.source !== null && surfaceExport.names.length === 0) {
      return [{ kind: 'wildcard-export', names: [], source: surfaceExport.source }];
    }
    if (surfaceExport.source === null) {
      // Local declarations (`export interface ...`): type-only by
      // construction, allowed.
      return [];
    }
    const isAliased = ALIAS_ROOTS.some(
      ([prefix]) =>
        surfaceExport.source === prefix || surfaceExport.source?.startsWith(`${prefix}/`),
    );
    if (!isAliased) {
      // External packages: only the reviewed type-only Journey Client
      // contract re-exports are allowed.
      if (!surfaceExport.typeOnly || !ALLOWED_EXTERNAL_TYPES.has(surfaceExport.source)) {
        return [
          { kind: 'forbidden-external', names: surfaceExport.names, source: surfaceExport.source },
        ];
      }
      return [];
    }
    // Package sources: the re-export must point at a module the package
    // build compiles (the collector's exclusions already keep out tests,
    // stories, tooling, `server/` and `constants.ts`). The runtime module
    // set is the single allowlist: a file's existence on disk proves
    // nothing — excluded sources (`constants.ts`, `server/`) also exist.
    if (!runtimeModules.has(surfaceExport.source)) {
      return [
        {
          kind: 'source-outside-surface',
          names: surfaceExport.names,
          source: surfaceExport.source,
        },
      ];
    }
    return [];
  });

/** Maps an absolute runtime-entry path to its package alias specifier. */
const aliasSpecifier = (absolutePath: string, packageRoot: string): string => {
  const relPath = absolutePath.startsWith(`${packageRoot}/`)
    ? absolutePath.slice(packageRoot.length + 1)
    : absolutePath;
  const specifier = relPath.startsWith('components/')
    ? `$components/${relPath.slice('components/'.length)}`
    : relPath.startsWith('journey/')
    ? `$journey/${relPath.slice('journey/'.length)}`
    : `$core/${relPath}`;
  return specifier.replace(/\.ts$/, '');
};

/**
 * Derives the package's runtime module set as alias specifiers from
 * `collect-entries.ts` (the package build's own entry collector, so the
 * parity surface is the build surface by construction). A module absent
 * here is not part of the package build, so the curated surface may not
 * re-export it.
 */
const collectRuntimeModules = (packageRoot: string): ReadonlySet<string> =>
  new Set(runtimeEntries.map((entry) => aliasSpecifier(entry, packageRoot)));

export { collectRuntimeModules };

/**
 * Full parity check on the real curated-surface file: reads it, collects
 * the package's runtime module set, and returns every violation. The
 * imperative shell; `parseSurface` and `checkSurface` stay pure.
 *
 * @param surfaceFile absolute path to `experimental/custom/login-framework.ts`
 * @param packageRoot absolute path to the `core/` package directory
 */
export const surfaceViolations = (
  surfaceFile: string,
  packageRoot: string,
): readonly SurfaceViolation[] => {
  const surfaceText = readFileSync(surfaceFile, 'utf8');
  return checkSurface({
    surface: parseSurface(surfaceText),
    runtimeModules: collectRuntimeModules(packageRoot),
  });
};
