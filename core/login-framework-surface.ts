/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { readFileSync } from 'fs';
import * as ts from 'typescript';

import { runtimeEntries } from './collect-entries';

/**
 * Import-surface parity check for the curated custom-component surface
 * (`custom/components/login-framework.ts`), per the Custom Components
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
 * The file is parsed with the TypeScript compiler API: the parser walks
 * real AST nodes, so statement forms are classified by the compiler instead
 * of by hand-written patterns.
 *
 * Build tooling, colocated with `vite-plugin-dist.ts` and excluded from the
 * package build by `collect-entries.ts`.
 */

/** One re-export (or local declaration) found in a surface file. */
export interface SurfaceExport {
  /** Exported names; empty for a wildcard re-export or a sentinel. */
  readonly names: readonly string[];
  /**
   * Module the names come from: an alias specifier, a bare package
   * specifier, or `null` for a local declaration or a sentinel.
   */
  readonly source: string | null;
  /** `true` for `export type { ... }` and `export interface/type`. */
  readonly typeOnly: boolean;
  /**
   * `true` for statement forms outside the surface grammar. Such entries
   * are fail-closed sentinels: `checkSurface` always rejects them, even
   * though `source` is null.
   */
  readonly unsupported: boolean;
}

/**
 * Why a surface export fails the parity check.
 *
 * `unsupported-export` marks a statement form outside the surface grammar
 * (`export const/function/class/let/default` and any other unreviewed
 * `export`). The curated surface never uses them, so the parse emits an
 * explicit violation sentinel instead of silently ignoring the statement
 * (fail closed): the check fails whenever the reviewed file drifts into an
 * unreviewed form.
 */
export type SurfaceViolationKind =
  | 'wildcard-export'
  | 'forbidden-external'
  | 'source-outside-surface'
  | 'unsupported-export';

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

/**
 * The identifier text of an import/export clause specifier. The compiler
 * gives `name` (the bound name, before `as`) and `propertyName` (the
 * original name after `as`); a bare `name` specifier has no property name.
 */
const specifierName = (element: ts.ImportOrExportSpecifier): string =>
  element.propertyName?.getText() ?? element.name.getText();

/** True when a clause specifier carries the inline `type` modifier. */
const isTypeOnlySpecifier = (element: ts.ImportOrExportSpecifier): boolean => element.isTypeOnly;

/** Parses the entries of an import/export `{ ... }` clause. */
const parseClauseEntries = (clause: ts.NamedImportsOrExports): readonly ClauseEntry[] =>
  clause.elements.map((element): ClauseEntry => {
    const name = specifierName(element);
    return {
      name,
      alias: element.propertyName === undefined ? name : element.name.getText(),
      typeOnly: isTypeOnlySpecifier(element),
    };
  });

/** Extracts the exported identifiers from an export `{ ... }` clause. */
const parseExportNames = (clause: ts.NamedExports): readonly string[] =>
  clause.elements.map((element) => element.name.getText());

/** True when any export `{ ... }` clause entry carries the inline `type` modifier. */
const clauseHasInlineType = (clause: ts.NamedExports): boolean =>
  clause.elements.some((element) => isTypeOnlySpecifier(element));

/** Module specifier text of an import/export declaration, when it has one. */
const moduleSpecifierOf = (node: ts.Node): string | undefined => {
  if (
    (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
    node.moduleSpecifier !== undefined &&
    ts.isStringLiteral(node.moduleSpecifier)
  ) {
    return node.moduleSpecifier.text;
  }
  return undefined;
};

/** Type-only flag of an import/export declaration plus its inline modifiers. */
const typeOnlyOf = (declaration: ts.ImportDeclaration | ts.ExportDeclaration): boolean =>
  declaration.isTypeOnly;

/**
 * Maps every locally bound import name to its import source.
 *
 * Walks import declarations of the parsed source: each `import type` (or
 * inline-type clause specifier) binds its names type-only, default and
 * namespace imports carry their source, and named imports map each alias to
 * it. So a local `export { x }` of an imported name resolves to that
 * import's source and cannot bypass the allowlist.
 */
const parseImportBindings = (sourceFile: ts.SourceFile): ReadonlyMap<string, ImportBinding> => {
  const bindings = new Map<string, ImportBinding>();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || statement.importClause === undefined) {
      continue;
    }
    const source = moduleSpecifierOf(statement);
    if (source === undefined) {
      continue;
    }
    const { importClause } = statement;
    const importTypeOnly = importClause.isTypeOnly;
    if (importClause.name !== undefined) {
      bindings.set(importClause.name.getText(), { source, typeOnly: importTypeOnly });
    }
    const named = importClause.namedBindings;
    if (named !== undefined) {
      if (ts.isNamespaceImport(named)) {
        bindings.set(named.name.getText(), { source, typeOnly: importTypeOnly });
      } else {
        for (const entry of parseClauseEntries(named)) {
          bindings.set(entry.alias, {
            source,
            typeOnly: importTypeOnly || entry.typeOnly,
          });
        }
      }
    }
  }
  return bindings;
};

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
  clause: ts.NamedExports;
  exportTypeOnly: boolean;
  importBindings: ReadonlyMap<string, ImportBinding>;
}): readonly SurfaceExport[] =>
  clause.elements.map((element): SurfaceExport => {
    const name = specifierName(element);
    const binding = importBindings.get(name);
    return {
      names: [element.name.getText()],
      source: binding?.source ?? null,
      typeOnly: exportTypeOnly || isTypeOnlySpecifier(element) || (binding?.typeOnly ?? false),
      unsupported: false,
    };
  });

/** Local declaration exports (`export interface X`, `export type X`). */
const unsupportedSentinel = (): SurfaceExport => ({
  names: [],
  source: null,
  typeOnly: false,
  unsupported: true,
});

/**
 * Parses the export statements of a surface file into typed exports.
 *
 * Pure compiler-API analysis of the curated-surface file. Statement forms
 * the surface grammar reviews are: `export [type] { names } [from
 * 'source']`, `export [type] * [as name] [from 'source']`, and local
 * `export interface/type` declarations. Any other `export` statement form
 * (`export const`, `export function`, `export default`, ...) is emitted as
 * a fail-closed sentinel export (`names: []`, `source: null`,
 * `unsupported: true`) that `checkSurface` always rejects, so the file is
 * lint-formatted and reviewed, and a statement the grammar does not cover
 * surfaces as a violation rather than staying invisible; the real-file test
 * guards against drift by asserting the parsed export count stays at the
 * reviewed baseline.
 */
export const parseSurface = (sourceText: string): SurfaceModule => {
  const sourceFile = ts.createSourceFile('surface.ts', sourceText, ts.ScriptTarget.Latest, true);

  const unsupported: SurfaceExport[] = [];
  const parsed: SurfaceExport[] = [];

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      const source = moduleSpecifierOf(statement);
      const typeOnly = typeOnlyOf(statement);
      const { exportClause } = statement;
      if (exportClause === undefined) {
        // `export * from 'source'` (with or without `as name`): a wildcard
        // re-export has no explicit names, so it parses with none and the
        // check rejects it.
        parsed.push({ names: [], source: source ?? null, typeOnly, unsupported: false });
      } else if (ts.isNamedExports(exportClause)) {
        if (source === undefined) {
          parsed.push(
            ...resolveLocalClause({
              clause: exportClause,
              exportTypeOnly: typeOnly,
              importBindings: parseImportBindings(sourceFile),
            }),
          );
        } else {
          parsed.push({
            names: parseExportNames(exportClause),
            source,
            typeOnly: typeOnly || clauseHasInlineType(exportClause),
            unsupported: false,
          });
        }
      } else {
        unsupported.push(unsupportedSentinel());
      }
    } else if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
      // `export interface X {}` / `export type X = ...`: local declarations,
      // type-only by construction, allowed.
      parsed.push({
        names: [statement.name.getText()],
        source: null,
        typeOnly: true,
        unsupported: false,
      });
    } else if (hasExportModifier(statement)) {
      // `export const/function/class/let/...`: an unreviewed statement form.
      // Fail closed with a sentinel.
      unsupported.push(unsupportedSentinel());
    } else if (ts.isExportAssignment(statement)) {
      // `export default ...`: an unreviewed statement form (no export
      // modifier to catch above). Fail closed with a sentinel.
      unsupported.push(unsupportedSentinel());
    }
  }

  return [...unsupported, ...parsed];
};

/** True when a statement carries an `export` modifier (local declaration exported). */
const hasExportModifier = (statement: ts.Node): boolean =>
  ts.canHaveModifiers(statement) &&
  (statement.modifiers ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);

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
    if (surfaceExport.unsupported) {
      return [{ kind: 'unsupported-export', names: [], source: null }];
    }
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
    // The collector maps `locales/...` sources to `$core/locales/...`, so a
    // `$locales/...` re-export is normalised to its mapped twin before the
    // lookup; without this the `$locales` alias root could never match.
    const source = surfaceExport.source.replace(/^\$locales(?:\/|$)/, '$core/locales/');
    if (!runtimeModules.has(surfaceExport.source) && !runtimeModules.has(source)) {
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
 * @param surfaceFile absolute path to `custom/components/login-framework.ts`
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
