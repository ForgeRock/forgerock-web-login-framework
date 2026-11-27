/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
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
 * (they compile only inside Storybook / Vitest), the same exclusion set
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
  | 'forbidden-dynamic'
  | 'forbidden-exempt-import'
  | 'relative-escape';

/** A boundary-check failure, with the offending specifier and source line. */
export interface CustomImportViolation {
  readonly kind: CustomImportViolationKind;
  readonly specifier: string;
  /** 1-based line of the offending import statement. */
  readonly line: number;
}

/**
 * A non-analyzable dynamic import: `import(x)`, `import(`${base}/${name}`)`,
 * or any `import(...)` whose argument is not a plain string literal. A
 * computed specifier can reach any module at runtime while the static parse
 * sees nothing, so it fails closed.
 */
interface DynamicImportCall {
  readonly expression: { readonly kind: number };
  readonly arguments?: readonly ts.Expression[];
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

/**
 * Placeholder specifier reported for dynamic imports whose argument is not a
 * plain string literal (`import(x)`, `import(\`${base}/x\`)`). These cannot be
 * resolved statically, so they fail closed under their own violation kind.
 */
const DYNAMIC_SPECIFIER_TEXT = '<dynamic import>';

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
 * Normalizes a path for segment resolution: to `/` separators, no trailing
 * slash, and no query string (Vite ids like `?raw` / `?inline`).
 */
const normalizePath = (path: string): string =>
  path.split('?')[0].split('\\').join('/').replace(/\/+$/, '');

/**
 * Joins a base directory and a relative rest into a normalized absolute path
 * (`/<segments>`), resolving every `.` and `..` segment. A `..` at the top of
 * the stack stays: the result then starts above the root, which the escape
 * checks below treat as outside.
 */
const joinAndResolve = (baseDir: string, relativeRest: string): string => {
  const segments: string[] = [];
  const pushAll = (path: string): void => {
    for (const segment of normalizePath(path).split('/')) {
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
  pushAll(baseDir);
  pushAll(relativeRest);
  return `/${segments.join('/')}`;
};

/**
 * Resolves a relative specifier against the importer's directory. Returns the
 * resolved path or `null` when the specifier is not relative.
 */
const resolveRelative = (specifier: string, importerDir: string): string | null => {
  const normalized = normalizePath(specifier);
  if (!normalized.startsWith('./') && !normalized.startsWith('../')) {
    return null;
  }
  return joinAndResolve(importerDir, normalized);
};

/**
 * The `$custom/...` alias with nothing (or only a query) after it. The bare
 * alias means the custom root itself, which is inside the custom root.
 */
const CUSTOM_ALIAS_ROOT_PATTERN = /^\/?$/;

/**
 * Resolves a `$custom/<rest>` specifier's path against the custom root.
 * Returns `null` when the specifier is not a `$custom/...` path.
 */
const resolveCustomAlias = (specifier: string, customRoot: string): string | null => {
  if (!specifier.startsWith(`${CUSTOM_ALIAS}/`)) {
    return null;
  }
  const rest = normalizePath(specifier.slice(CUSTOM_ALIAS.length + 1));
  return joinAndResolve(customRoot, CUSTOM_ALIAS_ROOT_PATTERN.test(rest) ? '' : rest);
};

/**
 * Escape-shaped specifiers the alias and relative checks never see: absolute
 * project paths (including Vite's `/@fs/` URLs), `file://` URLs, Windows
 * drive-letter paths, and backslash-leading paths. All resolve outside the
 * customer sandbox unless they name the custom root itself, so the check is
 * by shape, not content.
 */
const isEscapeShapedSpecifier = (specifier: string): boolean =>
  specifier.startsWith('/') ||
  specifier.startsWith('\\') ||
  specifier.startsWith('file://') ||
  /^[A-Za-z]:/.test(specifier);

/**
 * True when a specifier resolves outside `custom/components/`. Covers the
 * relative forms (`./`, `../`), the customer alias (`$custom/<rest>`, whose
 * rest is resolved against the custom root so `..` segments cannot climb
 * out), and the escape shapes (absolute, `/@fs/`, `file://`,
 * backslash-leading), which are outside unless they name a path inside the
 * custom root.
 */
const isSpecifierEscape = (specifier: string, importerDir: string, customRoot: string): boolean => {
  const root = normalizePath(customRoot);
  const insideRoot = (resolved: string): boolean =>
    resolved === root || resolved.startsWith(`${root}/`);

  if (specifier.startsWith(`${CUSTOM_ALIAS}/`)) {
    const resolved = resolveCustomAlias(specifier, customRoot);
    return resolved === null || !insideRoot(resolved);
  }

  if (isEscapeShapedSpecifier(specifier)) {
    // The only legitimate absolute specifier is the custom root itself or a
    // file inside it (used by tooling that pre-resolves aliases); everything
    // else reaches outside the sandbox.
    const normalized = normalizePath(specifier);
    const withoutFileScheme = normalized.startsWith('file://')
      ? normalized.slice('file://'.length)
      : normalized;
    return !insideRoot(withoutFileScheme);
  }

  const resolved = resolveRelative(specifier, importerDir);
  return resolved !== null && !insideRoot(resolved);
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
    if (call.expression?.kind === ts.SyntaxKind.ImportKeyword) {
      const argument = call.arguments?.[0];
      if (argument !== undefined && ts.isStringLiteral(argument)) {
        imports.push({
          specifier: argument.text,
          isTypeOnly: false,
          kind: 'dynamic',
          line: lineOf(node, sourceFile),
        });
      } else {
        // import(x), import(`${base}/secret`), import(someVar): a computed
        // specifier can resolve anything at runtime, so fail closed.
        imports.push({
          specifier: DYNAMIC_SPECIFIER_TEXT,
          isTypeOnly: false,
          kind: 'dynamic',
          line: lineOf(node, sourceFile),
        });
      }
      return;
    }
    // require('...'): Vite's commonjs plugin turns a CJS require in a
    // customer source file into a real import in the built bundle, so it
    // must clear the same boundary. Non-literal require() fails closed.
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'require' &&
      node.arguments.length === 1
    ) {
      const argument = node.arguments[0];
      if (argument !== undefined && ts.isStringLiteral(argument)) {
        imports.push({
          specifier: argument.text,
          isTypeOnly: false,
          kind: 'dynamic',
          line: lineOf(node, sourceFile),
        });
      } else {
        imports.push({
          specifier: DYNAMIC_SPECIFIER_TEXT,
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
 *
 * Svelte files are reduced to their `<script>` blocks plus their markup
 * expression code (via the Svelte compiler's own AST, matching how the
 * framework actually compiles them): parsing markup as TypeScript desyncs the
 * parser on markup characters (a lone backtick before the next `<script>` once
 * swallowed a whole forbidden import). Svelte discrimination is by file
 * extension, not text inspection: a TS/JS file can legitimately contain a
 * balanced `<script>...</script>` pair inside a string literal, and routing
 * such a file through the Svelte extractor would scan only the code inside
 * the pair while missing a forbidden import outside it (fail-open). A Svelte
 * file the compiler cannot parse falls back to whole-file parsing: the
 * compiler itself will fail the real build later, and the boundary check must
 * not be the thing that hides a syntax error. A UTF-8 BOM is stripped first
 * so the first import of a BOM-prefixed file is never missed.
 */
export const parseCustomImports = (
  sourceText: string,
  options: { readonly isSvelte?: boolean } = {},
): readonly LocatedImport[] => {
  // The UTF-8 BOM (U+FEFF), built from its char code: a literal in source
  // trips ESLint's no-irregular-whitespace rule.
  const bom = String.fromCharCode(0xfeff);
  const withoutBom = sourceText.startsWith(bom) ? sourceText.slice(1) : sourceText;
  const scriptBlocks = options.isSvelte ? extractSvelteScriptBlocks(withoutBom) : null;
  if (!scriptBlocks || scriptBlocks.length === 0) {
    // Not Svelte, or the compiler rejected it (genuine syntax error: the
    // consumer build reports it; the sweep degrades, never crashes).
    return parseAsTypeScript(withoutBom, 1);
  }
  // Two-pass scan for a Svelte file, unioned and deduped:
  //   1. The compiler's view: script blocks + markup expression ranges, so
  //      hostile markup cannot desync the TS parser (the original bypass).
  //   2. The whole file as TypeScript: catches import statements the
  //      extractor does not classify as component code (a bare import outside
  //      every script/expression range is dead markup text to Svelte but a
  //      real import to a bundler that ignores markup). The whole-file pass
  //      can itself desync on hostile markup and MISS some imports, but every
  //      miss is covered by pass 1, so the union never narrows what the
  //      pre-fix whole-file parse could see.
  const svelteView = scriptBlocks.flatMap(({ text, startLine }) => [
    ...collectImports(ts.createSourceFile('customer.ts', text, ts.ScriptTarget.Latest, true)).map(
      (importEntry) => ({ ...importEntry, line: importEntry.line + startLine - 1 }),
    ),
    ...globViolations(text, startLine),
  ]);
  const wholeFileView = parseAsTypeScript(withoutBom, 1);
  return dedupeImports([...svelteView, ...wholeFileView]);
};

/** Parses text as TypeScript, mapping violation lines through `startLine`. */
const parseAsTypeScript = (text: string, startLine: number): readonly LocatedImport[] => [
  ...collectImports(ts.createSourceFile('customer.ts', text, ts.ScriptTarget.Latest, true)).map(
    (importEntry) => ({ ...importEntry, line: importEntry.line + startLine - 1 }),
  ),
  ...globViolations(text, startLine),
];

/** Removes duplicate findings across the two Svelte passes (same line + specifier + kind). */
const dedupeImports = (imports: readonly LocatedImport[]): readonly LocatedImport[] => {
  const seen = new Set<string>();
  return imports.filter((importEntry) => {
    const key = `${importEntry.line}:${importEntry.specifier}:${importEntry.kind}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

/** The placeholder specifier reported for `import.meta.glob(...)` usage. */
const GLOB_SPECIFIER_TEXT = 'import.meta.glob(...)';

/**
 * Reports one violation per `import.meta.glob` / `import.meta.globEager`
 * occurrence in the checked text. Vite's glob transform rewrites these calls
 * into module maps the TS AST never sees as imports, and the glob argument is
 * dynamic, so the reached modules cannot be verified (fail closed). The scan
 * runs over the whole text with a whitespace-tolerant pattern, so a call
 * wrapped across lines (or carrying a TS generic) still matches.
 */
const globViolations = (text: string, startLine: number): readonly LocatedImport[] => {
  const matches: LocatedImport[] = [];
  const pattern = new RegExp(GLOB_IMPORT_PATTERN.source, 'g');
  let match = pattern.exec(text);
  while (match !== null) {
    matches.push({
      specifier: GLOB_SPECIFIER_TEXT,
      isTypeOnly: false,
      kind: 'dynamic',
      line: startLine + text.slice(0, match.index).split('\n').length - 1,
    });
    match = pattern.exec(text);
  }
  return matches;
};

/**
 * Matches `import.meta.glob(` / `import.meta.globEager(`, tolerating any
 * whitespace (including newlines) inside the member expression, a TS generic
 * argument (one nesting level), and before the call's paren, so multiline or
 * generic-typed call sites cannot slip through.
 */
const GLOB_IMPORT_PATTERN =
  /import\s*\.\s*(?:meta\s*\.\s*)?(?:glob|globEager)\s*(?:<(?:[^<>]|<[^<>]*>)*>)?\s*\(/;

/**
 * A script block extracted from a Svelte file, with the 1-based line of the
 * original file its first content line sits on (for violation reporting).
 */
interface ScriptBlock {
  readonly text: string;
  readonly startLine: number;
  /** The half-open byte range this block spans in the original source. */
  readonly range: { readonly start: number; readonly end: number };
}

/**
 * Extracts the import-bearing code from a Svelte file: every `<script>` /
 * `<script ...>` block (module + instance contexts) plus the compiled
 * expression code from the markup fragment (`{#await import('...')}`,
 * `{@const ...}`, attribute expressions: Svelte 5 compiles template
 * expressions into real runtime imports, so they are part of the boundary).
 * Uses the Svelte compiler's parse, the same reader the build uses. Returns
 * `null` when the text is not parseable Svelte (plain TS/JS, or Svelte with a
 * genuine syntax error: the consumer build reports that itself).
 */
const extractSvelteScriptBlocks = (sourceText: string): ScriptBlock[] | null => {
  try {
    // Resolved through createRequire from this module's own URL: a bare
    // `require('svelte/compiler')` call is rewritten by esbuild into Vite's
    // __require shim when this file lands in an ESM config bundle, and that
    // shim throws ("Dynamic require of ... is not supported"), silently
    // degrading the whole boundary check to whole-file parsing. createRequire
    // survives the ESM bundle and resolves svelte from the workspace install,
    // the same dependency the consumer build itself compiles with.
    const require = createRequire(import.meta.url);
    const { parse } = require('svelte/compiler') as {
      parse: (source: string) => SvelteParseResult;
    };
    const ast = parse(sourceText);
    const blocks: ScriptBlock[] = [];
    for (const script of [ast.module, ast.instance]) {
      if (script?.content) {
        blocks.push({
          text: sourceText.slice(script.content.start, script.content.end),
          startLine: sourceText.slice(0, script.content.start).split('\n').length,
          range: { start: script.content.start, end: script.content.end },
        });
      }
    }
    // Markup expressions: walk the fragment and slice out every expression's
    // code range. Svelte nodes carry start/end offsets into the source, so
    // each expression compiles exactly the text it spans.
    const stack: unknown[] = [ast.html];
    while (stack.length > 0) {
      const node = stack.pop();
      if (node === null || typeof node !== 'object') {
        continue;
      }
      const expression = (node as { expression?: { start: number; end: number } }).expression;
      if (
        expression &&
        typeof expression.start === 'number' &&
        typeof expression.end === 'number'
      ) {
        blocks.push({
          text: sourceText.slice(expression.start, expression.end),
          startLine: sourceText.slice(0, expression.start).split('\n').length,
          range: { start: expression.start, end: expression.end },
        });
      }
      for (const value of Object.values(node as Record<string, unknown>)) {
        if (Array.isArray(value)) {
          stack.push(...value);
        } else if (value !== null && typeof value === 'object') {
          stack.push(value);
        }
      }
    }
    return blocks;
  } catch {
    return null;
  }
};

/** The subset of the Svelte AST this extractor reads. */
interface SvelteParseResult {
  instance?: { content: { start: number; end: number } } | null;
  module?: { content: { start: number; end: number } } | null;
  /** The markup fragment root (Svelte 4/5: `html`, a Fragment node). */
  html?: unknown;
}

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
    if (
      importEntry.specifier === DYNAMIC_SPECIFIER_TEXT ||
      importEntry.specifier === GLOB_SPECIFIER_TEXT
    ) {
      return [violation('forbidden-dynamic')];
    }
    if (isForbiddenAlias(importEntry.specifier)) {
      return [violation('forbidden-alias')];
    }
    if (isForbiddenJourneyClient(importEntry.specifier, importEntry.isTypeOnly)) {
      return [violation('forbidden-external')];
    }
    if (isExemptImport(importEntry.specifier, importerDir, customRoot)) {
      // Checked before the escape gate on purpose: an absolute (or file://)
      // specifier that resolves inside the custom root is an allowed import
      // target, but when that target is an exempt file (mock, story, test,
      // declaration, the curated surface) the import must still fail closed.
      return [violation('forbidden-exempt-import')];
    }
    if (isSpecifierEscape(importEntry.specifier, importerDir, customRoot)) {
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

/**
 * File extensions the boundary check reads as source. Includes the ESM/JSX
 * variants and CommonJS: `.mjs`/`.mts`/`.jsx`/`.tsx`/`.cjs`/`.cts` compile to
 * the same bundle, so a forbidden import in one must fail the same way (a
 * `.ts`-only filter would let the import through on the renamed file).
 */
const SOURCE_EXTENSION_PATTERN = /\.(ts|js|tsx|jsx|mjs|mts|cjs|cts|svelte)$/;

/**
 * Extensions tried, in order, when an exempt-import target names no exact
 * file: the bare specifier, then the common source extensions, then a
 * directory index. Order is fixed and small on purpose, so the resolution is
 * deterministic across builds.
 */
const EXEMPT_IMPORT_EXTENSIONS = ['', '.ts', '.js', '.mts', '.mjs', '.svelte', '/index.ts'];

/**
 * Resolves an import specifier (relative, `$custom/...`, or an escape shape
 * that resolves inside the custom root) to a `custom/components/`-relative
 * path, trying the same extension order the boundary reads as source.
 * Returns `null` when no variant names an exempt file. Pure: works on the
 * specifier text only, no filesystem access.
 */
const resolveExemptTarget = (
  specifier: string,
  importerDir: string,
  customRoot: string,
): string | null => {
  const root = normalizePath(customRoot);
  const insideRoot = (resolved: string): boolean =>
    resolved === root || resolved.startsWith(`${root}/`);
  // Escape shapes (absolute, /@fs/, file://, drive-letter, backslash-leading)
  // resolve by shape: strip the file:// scheme and take the path as-is,
  // matching how the escape gate reads them. Relative and `$custom/` forms
  // resolve against their base.
  const escapeShaped = isEscapeShapedSpecifier(specifier);
  const target = escapeShaped
    ? (() => {
        const normalized = normalizePath(specifier);
        return normalized.startsWith('file://') ? normalized.slice('file://'.length) : normalized;
      })()
    : specifier.startsWith(`${CUSTOM_ALIAS}/`)
    ? joinAndResolve(customRoot, normalizePath(specifier.slice(CUSTOM_ALIAS.length + 1)))
    : resolveRelative(specifier, importerDir);
  if (target === null || !insideRoot(target)) {
    return null;
  }
  const relativeTarget = target === root ? '' : target.slice(root.length + 1);
  const extensionless =
    SOURCE_EXTENSION_PATTERN.test(relativeTarget) && !relativeTarget.endsWith('/index.ts')
      ? relativeTarget.replace(SOURCE_EXTENSION_PATTERN, '')
      : relativeTarget;
  for (const extension of EXEMPT_IMPORT_EXTENSIONS) {
    const candidate = `${extensionless}${extension}`;
    if (candidate !== '' && isExcludedFromCustomImports(candidate)) {
      return candidate;
    }
  }
  return null;
};

/**
 * True when a scanned (non-exempt) production file imports a file the
 * boundary exempts: stories, mocks, tests, declarations, or the curated
 * surface itself. Those files are never scanned, so an import of one would
 * pull unchecked source into the production bundle. Bare specifiers (npm
 * packages) are not paths and never resolve here.
 */
const isExemptImport = (specifier: string, importerDir: string, customRoot: string): boolean =>
  resolveExemptTarget(specifier, importerDir, customRoot) !== null;

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
        !isExcludedFromCustomImports(relativePath) && SOURCE_EXTENSION_PATTERN.test(relativePath),
    )
    .flatMap(({ full, relativePath }) => {
      const sourceText = readFileSync(full, 'utf8');
      const imports = parseCustomImports(sourceText, {
        isSvelte: relativePath.endsWith('.svelte'),
      });
      const violations = checkCustomImports({
        imports,
        importerDir: dirname(full),
        customRoot,
      });
      return violations.length > 0 ? [{ file: relativePath, violations }] : [];
    });
};
