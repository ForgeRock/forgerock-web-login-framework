/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import * as ts from 'typescript';

/**
 * Generated compiled form of the curated custom-component surface
 * (`custom/components/login-framework.ts`).
 *
 * The surface file is pure re-exports, so its compiled artifact needs no
 * bundling: every runtime re-export maps onto the package's emitted dist
 * path with the same rename conventions the client and server builds apply
 * (`foo.svelte` → `foo.component.js`, `foo.ts` → `foo.js`,
 * `index.json` → `index.json.js`). Consumers resolve `$login-framework` to
 * this generated module through the consumer-side dist resolver
 * (`vite-plugin-dist.ts`) — bundling the surface SOURCE transitively
 * re-exports the dist modules, which SvelteKit's build pipeline silently
 * miscompiles (imports from a source .ts re-export module are elided while
 * the referencing identifiers survive, yielding `Form is not defined` at
 * runtime; the widget library build compiles the same source correctly, so
 * only the SvelteKit graph needs the generated module).
 *
 * Type-only re-exports are skipped: dist carries no declaration files in
 * the build chain, and customer type imports keep resolving to the source
 * surface through tsconfig paths.
 *
 * Build tooling, colocated with `vite-plugin-dist.ts` and excluded from
 * the package build by `collect-entries.ts`.
 */

/** Which dist tree the generated module is emitted into. */
export type DistTree = 'client' | 'server';

/** One runtime re-export statement of the surface file. */
interface SurfaceReexport {
  /** Verbatim `{ ... }` clause text, e.g. `{ default as Form }`. */
  readonly clauseText: string;
  /** Alias module specifier, e.g. `$components/primitives/form/form.svelte`. */
  readonly source: string;
}

/** Alias roots the curated surface may re-export from (parity contract). */
const ALIAS_ROOTS = ['$core', '$components', '$journey', '$locales'] as const;

const isAliasedSource = (source: string): boolean =>
  ALIAS_ROOTS.some((prefix) => source === prefix || source.startsWith(`${prefix}/`));

/**
 * Extracts the runtime re-export statements of the surface file with the
 * TypeScript compiler API. Pure. Fails closed on every statement form the
 * surface grammar does not review (wildcard re-exports, local runtime
 * declarations, unsupported exports) — the parity check guarantees none of
 * these exist, and the generator refuses to guess.
 */
const parseRuntimeReexports = (surfaceText: string): readonly SurfaceReexport[] => {
  const sourceFile = ts.createSourceFile('surface.ts', surfaceText, ts.ScriptTarget.Latest, true);

  const reexports: SurfaceReexport[] = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isExportDeclaration(statement)) {
      // `export const/function/class/let`: a runtime local export is not a
      // reviewed surface form — fail closed rather than silently dropping
      // it from the generated module.
      const hasExportModifier =
        ts.canHaveModifiers(statement) &&
        (statement.modifiers ?? []).some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        );
      if (
        hasExportModifier &&
        !ts.isInterfaceDeclaration(statement) &&
        !ts.isTypeAliasDeclaration(statement)
      ) {
        throw new Error(
          'surfaceDistModule: unsupported surface statement (local runtime export) — run the surface parity check (check:surface) and fix the surface file first.',
        );
      }
      // Local declarations (`export interface X {}`, `export type X = ...`)
      // are type-only by construction and resolve from the source surface.
      continue;
    }
    const typeOnly =
      statement.isTypeOnly ||
      (statement.exportClause !== undefined &&
        ts.isNamedExports(statement.exportClause) &&
        statement.exportClause.elements.some((element) => element.isTypeOnly));
    if (typeOnly) {
      continue;
    }
    const { exportClause, moduleSpecifier } = statement;
    if (moduleSpecifier === undefined || !ts.isStringLiteral(moduleSpecifier)) {
      throw new Error(
        'surfaceDistModule: export declaration without a module specifier — run the surface parity check (check:surface) and fix the surface file first.',
      );
    }
    if (exportClause === undefined || !ts.isNamedExports(exportClause)) {
      throw new Error(
        `surfaceDistModule: wildcard re-export from "${moduleSpecifier.text}" — the curated surface must name every export explicitly.`,
      );
    }
    if (!isAliasedSource(moduleSpecifier.text)) {
      throw new Error(
        `surfaceDistModule: external runtime re-export "${moduleSpecifier.text}" — the curated surface may only re-export package modules (alias specifiers).`,
      );
    }
    reexports.push({
      clauseText: exportClause.getText(sourceFile),
      source: moduleSpecifier.text,
    });
  }

  return reexports;
};

/**
 * Maps a surface alias specifier onto its emitted dist path, relative to
 * the dist root (same emitted-name conventions as `vite-plugin-dist.ts`).
 * Pure.
 */
export const emittedRelativePath = (specifier: string): string => {
  const match = ALIAS_ROOTS.find(
    (prefix) => specifier === prefix || specifier.startsWith(`${prefix}/`),
  );
  if (match === undefined) {
    throw new Error(
      `surfaceDistModule: external runtime re-export "${specifier}" — the curated surface may only re-export package modules (alias specifiers).`,
    );
  }
  const rest = specifier === match ? '' : specifier.slice(match.length + 1);
  const treePrefix = match === '$core' ? '' : `${match.slice(1)}/`;
  const emitted = rest.endsWith('.ts')
    ? `${rest.slice(0, -'.ts'.length)}.js`
    : rest.endsWith('.svelte')
    ? `${rest.slice(0, -'.svelte'.length)}.component.js`
    : rest.endsWith('.json')
    ? `${rest}.js`
    : /\.(js|mjs|cjs)$/.test(rest)
    ? rest
    : `${rest}.js`;

  return `./${treePrefix}${emitted}`;
};

/**
 * Generates the dist surface module source from the curated surface text.
 * Pure.
 *
 * @param surfaceText the exact text of `custom/components/login-framework.ts`
 * @param _tree which dist tree the module is generated for (both trees
 *   mirror the same layout, so the output is identical; the parameter
 *   documents the call site)
 */
export const surfaceDistModule = (surfaceText: string, _tree: DistTree): string => {
  const statements = parseRuntimeReexports(surfaceText).map(
    (reexport) => `export ${reexport.clauseText} from '${emittedRelativePath(reexport.source)}';`,
  );

  return [
    '/**',
    ' * GENERATED by `core/login-framework-dist-surface.ts` — do not edit by hand.',
    ' * Compiled form of the curated custom-component surface',
    ' * (`custom/components/login-framework.ts`): runtime re-exports only,',
    " * pointing at the package build's emitted modules. Customer type",
    ' * imports resolve to the source surface through tsconfig paths.',
    ' */',
    ...statements,
    '',
  ].join('\n');
};
