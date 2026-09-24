import { FileSystem, Path } from '@effect/platform';
import { Console, Data, Effect } from 'effect';
import { parse } from 'svelte/compiler';

import { RegistryScanError } from '../errors.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type ComponentType = 'stage' | 'callback' | 'header' | 'footer';

const COMPONENT_TYPES = [
  'stage',
  'callback',
  'header',
  'footer',
] as const satisfies readonly ComponentType[];

const isComponentType = (value: string): value is ComponentType =>
  COMPONENT_TYPES.some((componentType) => componentType === value);

interface ComponentEntry {
  filePath: string;
  name: string;
  type: ComponentType;
  acceptedProps: string[];
}

// --------------------------------------------------------------------------
// Helpers (exported for testing)
// --------------------------------------------------------------------------

/** Extracts names of all `export let` prop declarations from a Svelte component's instance script. */
export function parseAcceptedProps(content: string): string[] {
  const abstractSyntaxTree = parse(content, { modern: false });
  const props: string[] = [];
  for (const node of abstractSyntaxTree.instance?.content.body ?? []) {
    if (node.type !== 'ExportNamedDeclaration') {
      continue;
    }
    if (node.declaration?.type === 'VariableDeclaration' && node.declaration.kind === 'let') {
      for (const declarator of node.declaration.declarations) {
        if (declarator.id.type === 'Identifier') {
          props.push(declarator.id.name);
        }
      }
    }
  }
  return props;
}

/**
 * Converts an arbitrary string to PascalCase, safe for use as a TypeScript identifier.
 *
 * Intentionally duplicated from core/journey/_utilities/registry/registry.ts — tools/cli
 * cannot depend on core/ (build-time vs. runtime boundary), so each package owns its own copy.
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr: string) => chr.toUpperCase())
    .replace(/^(.)/, (_, chr: string) => chr.toUpperCase());
}

/** Parses and validates the leading `<!-- @component -->` block from a Svelte file. */
export const parseComponentHeader = (
  filePath: string,
  content: string,
): Effect.Effect<{ type: ComponentType; name: string }, RegistryScanError> => {
  const fail = (cause: string) =>
    Effect.fail(new RegistryScanError({ directory: filePath, cause }));

  const commentMatch = content.match(/^<!--([\s\S]*?)-->/);
  if (!commentMatch) {
    return fail(
      'Missing @component header. Every custom component must begin with:\n' +
        '<!--\n   @component\n   Type: stage|callback|header|footer\n   Name: <ComponentName>\n   -->',
    );
  }

  const block = commentMatch[1];
  if (!block.includes('@component')) {
    return fail('Missing "@component" tag in the opening comment.');
  }

  const typeMatch = block.match(/Type:\s*(\S+)/);
  if (!typeMatch) {
    return fail(
      'Missing "Type:" field in @component header. Expected: Type: stage, callback, header, or footer',
    );
  }

  const rawType = typeMatch[1].toLowerCase();
  if (!isComponentType(rawType)) {
    return fail(
      `Invalid Type value "${typeMatch[1]}". Must be "stage", "callback", "header", or "footer".`,
    );
  }

  const nameMatch = block.match(/Name:\s*(.+)/);
  if (!nameMatch) {
    return fail('Missing "Name:" field in @component header. Expected: Name: <ComponentName>');
  }

  return Effect.succeed({ type: rawType as ComponentType, name: nameMatch[1].trim() });
};

// --------------------------------------------------------------------------
// File scanning
// --------------------------------------------------------------------------

const findSvelteFiles = (
  fs: FileSystem.FileSystem,
  path: Path.Path,
  dir: string,
): Effect.Effect<string[], RegistryScanError> =>
  fs.exists(dir).pipe(
    Effect.orElseSucceed(() => false),
    Effect.flatMap((exists) =>
      !exists
        ? Effect.succeed([])
        : fs.readDirectory(dir).pipe(
            Effect.mapError((cause) => new RegistryScanError({ directory: dir, cause })),
            Effect.flatMap((entries) =>
              Effect.forEach(
                entries,
                (entry) => {
                  const fullPath = path.join(dir, entry);
                  return fs.stat(fullPath).pipe(
                    Effect.mapError((cause) => new RegistryScanError({ directory: dir, cause })),
                    Effect.flatMap((stat) =>
                      stat.type === 'Directory'
                        ? findSvelteFiles(fs, path, fullPath)
                        : Effect.succeed(
                            entry.endsWith('.svelte') && !entry.endsWith('.story.svelte')
                              ? [fullPath]
                              : ([] as string[]),
                          ),
                    ),
                  );
                },
                { concurrency: 'unbounded' },
              ),
            ),
            Effect.map((nested) => nested.flat()),
          ),
    ),
  );

const scanDirectory = (
  fs: FileSystem.FileSystem,
  path: Path.Path,
  dir: string,
  expectedType: ComponentType,
): Effect.Effect<ComponentEntry[], RegistryScanError> =>
  findSvelteFiles(fs, path, dir).pipe(
    Effect.flatMap((files) =>
      Effect.validateAll(files, (filePath) =>
        fs.readFileString(filePath).pipe(
          Effect.mapError((cause) => new RegistryScanError({ directory: filePath, cause })),
          Effect.flatMap((content) =>
            parseComponentHeader(filePath, content).pipe(
              Effect.flatMap(({ type, name }) =>
                type !== expectedType
                  ? Effect.fail(
                      new RegistryScanError({
                        directory: filePath,
                        cause: `Component in /experimental/custom/${expectedType}s/ declares Type: "${type}". Must declare Type: ${expectedType}`,
                      }),
                    )
                  : Effect.succeed({
                      filePath,
                      name,
                      type,
                      acceptedProps: parseAcceptedProps(content),
                    }),
              ),
            ),
          ),
        ),
      ).pipe(
        Effect.mapError(
          (errors) =>
            new RegistryScanError({
              directory: dir,
              cause: errors.map((e) => String(e.cause)).join('\n'),
            }),
        ),
      ),
    ),
  );

// --------------------------------------------------------------------------
// Registry content builder (pure)
// --------------------------------------------------------------------------

/** Raised when components collide on a generated identifier or registry key. */
export class RegistryCollisionError extends Data.TaggedError('RegistryCollisionError')<{
  readonly kind: 'name-collision';
  readonly type: string;
  readonly name: string;
  readonly filePaths: string[];
}> {
  get message(): string {
    const collidingFiles = this.filePaths.map((filePath) => `  - ${filePath}`).join('\n');
    return (
      `Duplicate component name "${this.name}" in type "${this.type}". Colliding files:\n` +
      collidingFiles +
      `\nRename one component's "Name:" field so every ${this.type} has a unique generated identifier.`
    );
  }
}

interface RegistryVarEntry {
  varName: string;
  importPath: string;
  name: string;
  acceptedProps: string[];
}

export function buildRegistryContent(
  path: Path.Path,
  registryDir: string,
  stageComponents: ComponentEntry[],
  callbackComponents: ComponentEntry[],
  headerComponents: ComponentEntry[] = [],
  footerComponents: ComponentEntry[] = [],
): string {
  const toEntry =
    (prefix: string) =>
    ({ filePath, name, acceptedProps }: ComponentEntry) => {
      const relPath = path.relative(registryDir, filePath).replace(/\\/g, '/');
      const importPath = relPath.startsWith('.') ? relPath : `./${relPath}`;
      return { varName: `${prefix}${toPascalCase(name)}`, importPath, name, acceptedProps };
    };

  const stageEntries = stageComponents.map(toEntry('Stage'));
  const callbackEntries = callbackComponents.map(toEntry('Callback'));
  const headerEntries = headerComponents.map(toEntry('CustomHeader'));
  const footerEntries = footerComponents.map(toEntry('CustomFooter'));

  // Name collisions: any two components sharing a generated identifier would emit a
  // duplicate TS identifier (broken build) or a shadowed registry key (silent last-wins).
  const byVarName = new Map<string, { types: Set<string>; filePaths: string[] }>();
  const collect = (type: string, entries: RegistryVarEntry[]) => {
    for (const { varName, importPath, name } of entries) {
      const existing = byVarName.get(varName) ?? { types: new Set<string>(), filePaths: [] };
      existing.types.add(type);
      existing.filePaths.push(`${importPath} (Name: ${name})`);
      byVarName.set(varName, existing);
    }
  };
  collect('stage', stageEntries);
  collect('callback', callbackEntries);
  collect('header', headerEntries);
  collect('footer', footerEntries);

  for (const [varName, collisions] of byVarName) {
    if (collisions.filePaths.length > 1) {
      throw new RegistryCollisionError({
        kind: 'name-collision',
        type: [...collisions.types].join(', '),
        name: varName,
        filePaths: collisions.filePaths,
      });
    }
  }

  const lines: string[] = [
    `/**`,
    ` * AUTO-GENERATED — do not edit by hand.`,
    ` * Run \`pnpm build:widget\` or \`pnpm --filter @forgerock/login-widget exec vite build\` to regenerate.`,
    ` *`,
    ` * Source: /experimental/custom/{stages,callbacks,headers,footers}/`,
    ` */`,
    ``,
    `import type { Component } from 'svelte';`,
    ``,
    `export interface CustomRegistryEntry {`,
    `  component: Component;`,
    `  /** Props declared via \`export let\` in the component — only these are forwarded by the mapper. */`,
    `  acceptedProps: string[];`,
    `}`,
    ``,
  ];

  const collectImportBlock = (
    comment: string,
    entries: { varName: string; importPath: string }[],
  ) => {
    if (entries.length === 0) {
      return;
    }
    lines.push(comment);
    for (const { varName, importPath } of entries) {
      lines.push(`import ${varName} from '${importPath}';`);
    }
    lines.push(``);
  };

  collectImportBlock(`// Stage overrides / extensions`, stageEntries);
  collectImportBlock(`// Callback overrides / extensions`, callbackEntries);
  collectImportBlock(`// Custom headers (multiple allowed)`, headerEntries);
  collectImportBlock(`// Custom footers (multiple allowed)`, footerEntries);

  const pushRecordRegistry = (
    exportName: string,
    entries: { varName: string; name: string; acceptedProps: string[] }[],
  ) => {
    lines.push(`export const ${exportName}: Record<string, CustomRegistryEntry> = {`);
    for (const { varName, name, acceptedProps } of entries) {
      lines.push(
        `  ${JSON.stringify(
          name,
        )}: { get component() { return ${varName}; }, acceptedProps: ${JSON.stringify(
          acceptedProps,
        )} },`,
      );
    }
    lines.push(`};`);
    lines.push(``);
  };

  pushRecordRegistry('customStageRegistry', stageEntries);
  pushRecordRegistry('customCallbackRegistry', callbackEntries);
  pushRecordRegistry('customHeaderRegistry', headerEntries);
  pushRecordRegistry('customFooterRegistry', footerEntries);

  return lines.join('\n');
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

/**
 * Scans `experimental/custom/{stages,callbacks,headers,footers}/` for
 * `@component`-annotated Svelte files and writes
 * `core/journey/_utilities/registry/custom-registry.ts`.
 *
 * All I/O runs in-process via the platform `FileSystem` service — no subprocess
 * spawning. Validation errors across multiple components are collected and
 * reported together.
 */
export const runRegistryScript = (projectDir: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const stageDir = path.join(projectDir, 'experimental', 'custom', 'stages');
    const callbackDir = path.join(projectDir, 'experimental', 'custom', 'callbacks');
    const headerDir = path.join(projectDir, 'experimental', 'custom', 'headers');
    const footerDir = path.join(projectDir, 'experimental', 'custom', 'footers');
    const registryDir = path.join(projectDir, 'core', 'journey', '_utilities', 'registry');
    const registryPath = path.join(registryDir, 'custom-registry.ts');

    const [stageComponents, callbackComponents, headerComponents, footerComponents] =
      yield* Effect.all(
        [
          scanDirectory(fs, path, stageDir, 'stage'),
          scanDirectory(fs, path, callbackDir, 'callback'),
          scanDirectory(fs, path, headerDir, 'header'),
          scanDirectory(fs, path, footerDir, 'footer'),
        ],
        { concurrency: 'unbounded' },
      );

    const content = yield* Effect.try({
      try: () =>
        buildRegistryContent(
          path,
          registryDir,
          stageComponents,
          callbackComponents,
          headerComponents,
          footerComponents,
        ),
      catch: (cause) => cause,
    });

    yield* fs
      .makeDirectory(registryDir, { recursive: true })
      .pipe(Effect.mapError((cause) => new RegistryScanError({ directory: registryDir, cause })));
    yield* fs
      .writeFileString(registryPath, content)
      .pipe(Effect.mapError((cause) => new RegistryScanError({ directory: registryPath, cause })));

    const lines = [
      stageComponents.length > 0 &&
        `  Stages    (${stageComponents.length}): ${stageComponents
          .map((stageComponent) => stageComponent.name)
          .join(', ')}`,
      callbackComponents.length > 0 &&
        `  Callbacks (${callbackComponents.length}): ${callbackComponents
          .map((callbackComponent) => callbackComponent.name)
          .join(', ')}`,
      headerComponents.length > 0 &&
        `  Headers   (${headerComponents.length}): ${headerComponents
          .map((headerComponent) => headerComponent.name)
          .join(', ')}`,
      footerComponents.length > 0 &&
        `  Footers   (${footerComponents.length}): ${footerComponents
          .map((footerComponent) => footerComponent.name)
          .join(', ')}`,
    ].filter((line): line is string => line !== false);

    if (lines.length === 0) {
      yield* Console.log(
        `custom-registry.ts generated (no custom components found — registries are empty)`,
      );
    } else {
      yield* Console.log(`custom-registry.ts generated:`);
      for (const line of lines) {
        yield* Console.log(line);
      }
    }
  });
