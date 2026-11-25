/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import * as ts from 'typescript';

import type { SourceFile } from 'typescript';

/**
 * Forbidden-import enforcement for customer source (`custom/components/`),
 * per the Custom Components public API contract ("Prohibited imports"):
 *
 *   Customer components must not import `$core`, `$journey`, `$components`,
 *   stores, callback or stage mappers, registries, server code, internal
 *   effects, or Storybook helpers. The custom-component compiler and CI
 *   enforce this with an import allowlist and compile-fail fixtures.
 *
 * Customer source may import:
 *   - the curated surface module (`$login-framework`),
 *   - the customer-directory alias (`$custom/...`) and relative paths that
 *     stay inside `custom/components/`,
 *   - bare npm packages (`svelte`, `svelte/store`, …), and
 *   - the Journey Client **type-only** contract (`@forgerock/journey-client/types`).
 *
 * Everything else fails: internal `$`-aliases (fail closed, including
 * unknown ones), the Journey Client package at runtime, and relative paths
 * escaping `custom/components/`. Story, mock, and test files are exempt
 * (they compile only inside Storybook / Vitest) — the same exclusion set
 * `collect-entries.ts` uses for the package build surface.
 *
 * The file is parsed with the TypeScript compiler API, like
 * `login-framework-surface.ts`: imports are classified from real AST nodes,
 * so comments and string literals cannot smuggle a specifier through.
 *
 * Build tooling, colocated with `login-framework-surface.ts` and excluded
 * from the package build by `collect-entries.ts`.
 */

/** One import (or re-export / dynamic import) found in a customer file. */
export interface CustomImport {
  /** Module specifier text exactly as written in the source. */
  readonly specifier: string;
  /** `true` for `import type`, `export type ... from`, and inline `type` modifiers. */
  readonly isTypeOnly: boolean;
  /** Statement form the specifier was found in. */
  readonly kind: 'import' | 'export-from' | 'dynamic';
}

/** A parsed import plus its location, carried through to violations. */
type LocatedImport = CustomImport & { readonly line: number };

/** Why a customer-source import fails the boundary check. */
export type CustomImportViolationKind =
  | 'forbidden-alias'
  | 'forbidden-external'
  | 'relative-escape';

/** A boundary-check failure, with the offending specifier and source line. */
export interface CustomImportViolation {
  readonly kind: CustomImportViolationKind;
  readonly specifier: string;
  /** 1-based line of the offending import statement. */
  readonly line: number;
}

/**
 * The specifier of a dynamic `import(...)`. The compiler API has no
 * dedicated node type, so model the shape this parser reads: the first
 * argument, when it is a string literal.
 */
interface DynamicImportCall {
  readonly expression: { readonly kind: number };
  readonly arguments?: readonly { readonly kind: number; readonly text?: string }[];
}

/**
 * The internal `$`-aliases the framework resolves (`$core`, `$components`,
 * `$journey`, `$locales`). A customer file that imports one reaches into
 * framework internals instead of the curated surface. Any `$`-prefixed
 * specifier outside the two customer aliases also fails (fail closed): an
 * unknown alias is by definition not a documented customer import form.
 */

/** The one curated surface module customer source imports from. */
const SURFACE_SPECIFIER = '$login-framework';

/** The customer-directory alias, resolving inside `custom/components/`. */
const CUSTOM_ALIAS = '$custom';

/**
 * The only external package contract customer source may use, and only
 * type-only: the Journey Client types. A runtime import of the package (or
 * any other subpath) reaches into the SDK's network client, which is the
 * framework's dependency, not the customer's.
 */
const JOURNEY_CLIENT_PACKAGE = '@forgerock/journey-client';
const JOURNEY_CLIENT_TYPES_SUBPATH = `${JOURNEY_CLIENT_PACKAGE}/types`;

/**
 * True when a specifier is one of the internal `$`-aliases (or any unknown
 * `$`-alias, fail closed). `$login-framework` and `$custom` (with a
 * subpath) are the customer's two allowed `$` forms.
 */
const isForbiddenAlias = (specifier: string): boolean => {
  if (specifier === SURFACE_SPECIFIER || specifier.startsWith(`${CUSTOM_ALIAS}/`)) {
    return false;
  }
  return specifier.startsWith('$');
};

/** True when a specifier reaches the Journey Client package outside its type-only types contract. */
const isForbiddenJourneyClient = (specifier: string, isTypeOnly: boolean): boolean => {
  if (specifier !== JOURNEY_CLIENT_PACKAGE && !specifier.startsWith(`${JOURNEY_CLIENT_PACKAGE}/`)) {
    return false;
  }
  return !isTypeOnly || specifier !== JOURNEY_CLIENT_TYPES_SUBPATH;
};

/**
 * Resolves a relative specifier against the importer's directory and
 * normalizes `.`/`..` segments. Returns the resolved path or `null` when
 * the specifier is not relative.
 */
const resolveRelative = (specifier: string, importerDir: string): string | null => {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
    return null;
  }
  const withoutQuery = specifier.split('?')[0] ?? specifier;
  const segments: string[] = [];
  const pushAll = (path: string): void => {
    for (const segment of path.split('/')) {
      if (segment === '' || segment === '.') {
        continue;
      }
      if (segment === '..') {
        segments.pop();
        continue;
      }
      segments.push(segment);
    }
  };
  pushAll(importerDir.split('\\').join('/'));
  pushAll(withoutQuery.split('\\').join('/'));
  return `/${segments.join('/')}`;
};

/**
 * True when a relative specifier resolves outside `custom/components/`.
 * Virtual modules (`\0...`) are never relative, so they fall through here.
 */
const isRelativeEscape = (specifier: string, importerDir: string, customRoot: string): boolean => {
  const resolved = resolveRelative(specifier, importerDir);
  if (resolved === null) {
    return false;
  }
  const root = `/${customRoot.split('\\').join('/').replace(/^\/+/, '')}`;
  return !resolved.startsWith(`${root}/`) && resolved !== root;
};

/**
 * Line of a node's first token, 1-based. `ts.getLineAndCharacterOfPosition`
 * needs the originating source file, which the walk carries.
 */
const lineOf = (node: ts.Node, sourceFile: SourceFile): number =>
  sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

/**
 * Walks every node collecting import specifiers: import declarations,
 * re-exports, and dynamic `import(...)` calls. Specifier text comes from
 * real AST nodes, so comments and string literals cannot smuggle an import
 * through.
 */
const collectImports = (sourceFile: SourceFile): readonly LocatedImport[] => {
  const imports: LocatedImport[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const clause = node.importClause;
      const inlineTypeOnly =
        clause?.namedBindings !== undefined && ts.isNamedImports(clause.namedBindings)
          ? clause.namedBindings.elements.some((element) => element.isTypeOnly)
          : false;
      imports.push({
        specifier: node.moduleSpecifier.text,
        isTypeOnly: (clause?.isTypeOnly ?? false) || inlineTypeOnly,
        kind: 'import',
        line: lineOf(node, sourceFile),
      });
      return;
    }
    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push({
        specifier: node.moduleSpecifier.text,
        isTypeOnly: node.isTypeOnly,
        kind: 'export-from',
        line: lineOf(node, sourceFile),
      });
      return;
    }
    const call = node as unknown as DynamicImportCall;
    if (call.expression?.kind === ts.SyntaxKind.ImportKeyword && call.arguments?.[0]) {
      const argument = call.arguments[0];
      if (argument !== undefined && ts.isStringLiteral(argument as ts.Node)) {
        imports.push({
          specifier: (argument as { readonly text: string }).text,
          isTypeOnly: false,
          kind: 'dynamic',
          line: lineOf(node, sourceFile),
        });
      }
      return;
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return imports;
};

/**
 * Parses customer source text into its import records, keeping each import's
 * 1-based line so violations can point at the statement.
 */
export const parseCustomImports = (sourceText: string): readonly LocatedImport[] =>
  collectImports(ts.createSourceFile('customer.ts', sourceText, ts.ScriptTarget.Latest, true));

/**
 * Checks parsed imports against the customer boundary. `importerDir` is the
 * absolute directory of the file being checked; `customRoot` the absolute
 * `custom/components/` root. Pure: no filesystem access.
 */
export const checkCustomImports = ({
  imports,
  importerDir,
  customRoot,
}: {
  readonly imports: readonly (CustomImport & { readonly line?: number })[];
  readonly importerDir: string;
  readonly customRoot: string;
}): readonly CustomImportViolation[] =>
  imports.flatMap((importEntry) => {
    const violation = (kind: CustomImportViolationKind): CustomImportViolation => ({
      kind,
      specifier: importEntry.specifier,
      line: importEntry.line ?? 0,
    });
    if (isForbiddenAlias(importEntry.specifier)) {
      return [violation('forbidden-alias')];
    }
    if (isForbiddenJourneyClient(importEntry.specifier, importEntry.isTypeOnly)) {
      return [violation('forbidden-external')];
    }
    if (isRelativeEscape(importEntry.specifier, importerDir, customRoot)) {
      return [violation('relative-escape')];
    }
    return [];
  });

/**
 * File-selection predicate shared by the Vite plugin and the tree sweep:
 * true when a `custom/components/`-relative file is exempt from the
 * boundary. Exempt files compile only inside Storybook or Vitest, which
 * resolve the internal aliases themselves.
 */
export const isExcludedFromCustomImports = (relativePath: string): boolean => {
  const normalized = relativePath.split('\\').join('/');
  if (normalized === 'login-framework.ts') {
    return true;
  }
  return (
    normalized.endsWith('.test.ts') ||
    normalized.endsWith('.d.ts') ||
    normalized.endsWith('.mock.ts') ||
    normalized.endsWith('.stories.js') ||
    normalized.endsWith('.stories.ts') ||
    normalized.endsWith('.story.svelte')
  );
};

/** One file's violations, as the sweep and the Vite plugin report them. */
export interface CustomImportFileViolations {
  /** Path as reported to the user (project-root-relative, `/`-separated). */
  readonly file: string;
  readonly violations: readonly CustomImportViolation[];
}

/**
 * Recursively scans `<projectRoot>/custom/components/` for production files
 * and returns every file with at least one boundary violation. The
 * imperative shell for the CI sweep; the pure check lives in
 * `checkCustomImports`.
 */
export const scanCustomComponents = (
  projectRoot: string,
): readonly CustomImportFileViolations[] => {
  const customRoot = join(projectRoot, 'custom', 'components');
  const collect = (dir: string): readonly string[] =>
    readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry);
      return statSync(full).isDirectory() ? collect(full) : [full];
    });

  return collect(customRoot)
    .map((full) => {
      const relativePath = relative(customRoot, full).split('\\').join('/');
      return { full, relativePath };
    })
    .filter(
      ({ relativePath }) =>
        !isExcludedFromCustomImports(relativePath) &&
        (relativePath.endsWith('.ts') ||
          relativePath.endsWith('.svelte') ||
          relativePath.endsWith('.js')),
    )
    .flatMap(({ full, relativePath }) => {
      const sourceText = readFileSync(full, 'utf8');
      const imports = parseCustomImports(sourceText);
      const violations = checkCustomImports({
        imports,
        importerDir: full.replace(/\/[^/]*$/, ''),
        customRoot,
      });
      return violations.length > 0 ? [{ file: relativePath, violations }] : [];
    });
};
