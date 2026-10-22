import ts from 'typescript';

// IAM-12011 T5 proof: rewrites a compiled custom component so it receives the
// host's framework instance instead of importing bare specifiers.
//
//   import * as $ from 'svelte/internal/client';
//   import { Button } from '$login-framework';
//   export default function Component(...) { ... }
//
// becomes
//
//   export default function (__framework) {
//     const $ = __framework["svelte/internal/client"];
//     const { Button } = __framework["$login-framework"];
//     function Component(...) { ... }
//     return Component;
//   }
//
// The result is a module with no bare imports, so a classic page can fetch it
// with `import(url)` without defining an import map, and the host decides which
// Svelte runtime and framework instance the component runs against.

export const FRAMEWORK_PARAMETER = '__framework';

export type InjectionResult =
  | {
      readonly kind: 'ok';
      readonly code: string;
      // Specifiers the host must supply on the framework object.
      readonly injectedSpecifiers: readonly string[];
      // Side-effect-only imports the host must already have executed
      // (they register Svelte runtime flags; there is nothing to inject).
      readonly hostPreloadedSpecifiers: readonly string[];
    }
  | { readonly kind: 'error'; readonly message: string };

type StatementRewrite =
  | { readonly kind: 'code'; readonly text: string }
  | { readonly kind: 'injected'; readonly specifier: string; readonly text: string }
  | { readonly kind: 'preloaded'; readonly specifier: string }
  | { readonly kind: 'error'; readonly message: string };

const lookup = (specifier: string): string =>
  `${FRAMEWORK_PARAMETER}[${JSON.stringify(specifier)}]`;

const hasModifier = (node: ts.Node, kind: ts.SyntaxKind): boolean =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === kind);

const rewriteImport = (declaration: ts.ImportDeclaration): StatementRewrite => {
  if (!ts.isStringLiteral(declaration.moduleSpecifier)) {
    return { kind: 'error', message: 'Import with a non-string specifier' };
  }
  const specifier = declaration.moduleSpecifier.text;
  const importClause = declaration.importClause;

  if (!importClause) {
    return { kind: 'preloaded', specifier };
  }
  if (importClause.isTypeOnly) {
    return { kind: 'code', text: '' };
  }

  const defaultBinding = importClause.name
    ? [`const ${importClause.name.text} = ${lookup(specifier)}.default;`]
    : [];
  const namedBindings = importClause.namedBindings;

  if (namedBindings && ts.isNamespaceImport(namedBindings)) {
    return {
      kind: 'injected',
      specifier,
      text: [...defaultBinding, `const ${namedBindings.name.text} = ${lookup(specifier)};`].join(
        '\n',
      ),
    };
  }

  const namedElements = namedBindings && ts.isNamedImports(namedBindings) ? namedBindings : null;
  const destructured = namedElements
    ? [
        `const { ${namedElements.elements
          .map((element) =>
            element.propertyName
              ? `${element.propertyName.text}: ${element.name.text}`
              : element.name.text,
          )
          .join(', ')} } = ${lookup(specifier)};`,
      ]
    : [];

  return { kind: 'injected', specifier, text: [...defaultBinding, ...destructured].join('\n') };
};

const rewriteStatement = (statement: ts.Statement, sourceFile: ts.SourceFile): StatementRewrite => {
  if (ts.isImportDeclaration(statement)) {
    return rewriteImport(statement);
  }
  if (ts.isExportDeclaration(statement) || ts.isExportAssignment(statement)) {
    return { kind: 'error', message: 'Only a default function export is supported' };
  }
  if (ts.isFunctionDeclaration(statement) && hasModifier(statement, ts.SyntaxKind.ExportKeyword)) {
    const isDefault = hasModifier(statement, ts.SyntaxKind.DefaultKeyword);
    return isDefault
      ? {
          kind: 'code',
          text: statement.getText(sourceFile).replace(/^export\s+default\s+/, ''),
        }
      : { kind: 'error', message: 'Only a default function export is supported' };
  }
  if (ts.isVariableStatement(statement) && hasModifier(statement, ts.SyntaxKind.ExportKeyword)) {
    return { kind: 'error', message: 'Only a default function export is supported' };
  }
  return { kind: 'code', text: statement.getText(sourceFile) };
};

export function rewriteImportsToInjection(compiledJs: string): InjectionResult {
  const sourceFile = ts.createSourceFile(
    'component.js',
    compiledJs,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.JS,
  );
  const rewrites = sourceFile.statements.map((statement) =>
    rewriteStatement(statement, sourceFile),
  );

  const firstError = rewrites.find((rewrite) => rewrite.kind === 'error');
  if (firstError && firstError.kind === 'error') {
    return { kind: 'error', message: firstError.message };
  }

  const bodyLines = rewrites.flatMap((rewrite) =>
    rewrite.kind === 'code' || rewrite.kind === 'injected' ? [rewrite.text] : [],
  );
  const injectedSpecifiers = rewrites.flatMap((rewrite) =>
    rewrite.kind === 'injected' ? [rewrite.specifier] : [],
  );
  const hostPreloadedSpecifiers = rewrites.flatMap((rewrite) =>
    rewrite.kind === 'preloaded' ? [rewrite.specifier] : [],
  );

  return {
    kind: 'ok',
    code: [
      `export default function (${FRAMEWORK_PARAMETER}) {`,
      ...bodyLines,
      'return Component;',
      '}',
    ].join('\n'),
    injectedSpecifiers: [...new Set(injectedSpecifiers)],
    hostPreloadedSpecifiers: [...new Set(hostPreloadedSpecifiers)],
  };
}
