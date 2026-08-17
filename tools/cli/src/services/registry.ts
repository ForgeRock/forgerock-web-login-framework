import { FileSystem, Path } from '@effect/platform';
import { Console, Effect } from 'effect';
import { parse } from 'svelte/compiler';

import { RegistryScanError } from '../errors.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type ComponentType = 'stage' | 'callback';

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

function toPascalCase(str: string): string {
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
  if (!commentMatch)
    return fail(
      'Missing @component header. Every custom component must begin with:\n' +
        '<!--\n   @component\n   Type: stage|callback\n   Name: <ComponentName>\n   -->',
    );

  const block = commentMatch[1];
  if (!block.includes('@component'))
    return fail('Missing "@component" tag in the opening comment.');

  const typeMatch = block.match(/Type:\s*(\S+)/);
  if (!typeMatch)
    return fail(
      'Missing "Type:" field in @component header. Expected: Type: stage or Type: callback',
    );

  const rawType = typeMatch[1].toLowerCase();
  if (rawType !== 'stage' && rawType !== 'callback')
    return fail(`Invalid Type value "${typeMatch[1]}". Must be "stage" or "callback".`);

  const nameMatch = block.match(/Name:\s*(.+)/);
  if (!nameMatch)
    return fail('Missing "Name:" field in @component header. Expected: Name: <ComponentName>');

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

export function buildRegistryContent(
  path: Path.Path,
  registryDir: string,
  stageComponents: ComponentEntry[],
  callbackComponents: ComponentEntry[],
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

  const lines: string[] = [
    `/**`,
    ` * AUTO-GENERATED — do not edit by hand.`,
    ` * Run \`pnpm build:widget\` or \`pnpm --filter @forgerock/login-widget exec vite build\` to regenerate.`,
    ` *`,
    ` * Source: /experimental/custom/stages/ and /experimental/custom/callbacks/`,
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

  if (stageEntries.length > 0) {
    lines.push(`// Stage overrides / extensions`);
    for (const { varName, importPath } of stageEntries)
      lines.push(`import ${varName} from '${importPath}';`);
    lines.push(``);
  }

  if (callbackEntries.length > 0) {
    lines.push(`// Callback overrides / extensions`);
    for (const { varName, importPath } of callbackEntries)
      lines.push(`import ${varName} from '${importPath}';`);
    lines.push(``);
  }

  lines.push(`export const customStageRegistry: Record<string, CustomRegistryEntry> = {`);
  for (const { varName, name, acceptedProps } of stageEntries)
    lines.push(
      `  ${JSON.stringify(
        name,
      )}: { get component() { return ${varName}; }, acceptedProps: ${JSON.stringify(
        acceptedProps,
      )} },`,
    );
  lines.push(`};`);
  lines.push(``);

  lines.push(`export const customCallbackRegistry: Record<string, CustomRegistryEntry> = {`);
  for (const { varName, name, acceptedProps } of callbackEntries)
    lines.push(
      `  ${JSON.stringify(
        name,
      )}: { get component() { return ${varName}; }, acceptedProps: ${JSON.stringify(
        acceptedProps,
      )} },`,
    );
  lines.push(`};`);
  lines.push(``);

  return lines.join('\n');
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

/**
 * Scans `experimental/custom/stages/` and `experimental/custom/callbacks/` for
 * `@component`-annotated Svelte files and writes
 * `core/journey/_utilities/custom-registry.ts`.
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
    const registryDir = path.join(projectDir, 'core', 'journey', '_utilities', 'registry');
    const registryPath = path.join(registryDir, 'custom-registry.ts');

    const [stageComponents, callbackComponents] = yield* Effect.all(
      [
        scanDirectory(fs, path, stageDir, 'stage'),
        scanDirectory(fs, path, callbackDir, 'callback'),
      ],
      { concurrency: 'unbounded' },
    );

    const content = buildRegistryContent(path, registryDir, stageComponents, callbackComponents);

    yield* fs
      .makeDirectory(registryDir, { recursive: true })
      .pipe(Effect.mapError((cause) => new RegistryScanError({ directory: registryDir, cause })));
    yield* fs
      .writeFileString(registryPath, content)
      .pipe(Effect.mapError((cause) => new RegistryScanError({ directory: registryPath, cause })));

    const total = stageComponents.length + callbackComponents.length;
    if (total === 0) {
      yield* Console.log(
        `custom-registry.ts generated (no custom components found — registries are empty)`,
      );
    } else {
      yield* Console.log(`custom-registry.ts generated:`);
      if (stageComponents.length > 0)
        yield* Console.log(
          `  Stages    (${stageComponents.length}): ${stageComponents
            .map((c) => c.name)
            .join(', ')}`,
        );
      if (callbackComponents.length > 0)
        yield* Console.log(
          `  Callbacks (${callbackComponents.length}): ${callbackComponents
            .map((c) => c.name)
            .join(', ')}`,
        );
    }
  });
