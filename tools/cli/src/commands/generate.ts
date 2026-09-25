import { Args, Command, Prompt } from '@effect/cli';
import { FileSystem, Path } from '@effect/platform';
import { Console, Effect, Schema } from 'effect';
import { existsSync } from 'node:fs';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertValidProject } from '../config/version.js';
import { ComponentAlreadyExistsError, InvalidComponentNameError } from '../errors.js';
import { expandTilde } from '../services/file-system.js';
import { runRegistryScript } from '../services/registry.js';
import { toPascalCase } from '../utils.js';

const CUSTOM_DIR = 'experimental/custom';

/**
 * Converts a PascalCase name to a kebab-case slug.
 * Uses two passes to correctly handle acronyms.
 * The acronym-boundary pass requires 2+ leading capitals so a single leading capital
 * (e.g. "OAuth") isn't mistaken for an acronym run and split off on its own.
 * Examples: "MyCallback" → "my-callback", "JWTLogin" → "jwt-login", "MyURLCallback" → "my-url-callback",
 * "OAuth2Login" → "oauth2-login"
 */
function toKebabCase(name: string): string {
  return name
    .replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Converts an arbitrary string to a kebab-case directory slug.
 * Used for stage names which may contain spaces, hyphens, or mixed case.
 * Delegates PascalCase/acronym word-boundary splitting to toKebabCase, then normalizes
 * any remaining separators (spaces, underscores, hyphens) since, unlike callback names,
 * stage names aren't constrained to alphanumeric PascalCase.
 * Examples: "My Login Stage" → "my-login-stage", "DefaultLogin" → "default-login", "OTP Login" → "otp-login"
 */
function toSlug(name: string): string {
  return toKebabCase(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validates a callback component name: must be a valid name (PascalCase, alphanumeric only).
 * Callback names are driven by AM's callback type strings (e.g. NameCallback, PasswordCallback).
 */
export const CallbackNameSchema = Schema.String.pipe(
  Schema.filter((s) => /^[A-Z][A-Za-z0-9]+$/.test(s)),
  Schema.transform(Schema.Struct({ name: Schema.String, slug: Schema.String }), {
    strict: true,
    decode: (name) => ({ name, slug: toKebabCase(name) }),
    encode: ({ name }) => name,
  }),
);

/**
 * Validates a stage component name: accepts any string that is safe for a directory name and
 * HTML comment embedding. Stage names in AM are arbitrary strings set on the Page Node — there
 * is no name constraint, unlike callbacks.
 */
export const StageNameSchema = Schema.String.pipe(
  Schema.filter(
    (s) =>
      s.length >= 2 &&
      /[A-Za-z]/.test(s) &&
      !s.includes('\0') &&
      !/[\n\r]/.test(s) &&
      !/^\.\.?[/\\]/.test(s),
  ),
  Schema.transform(Schema.Struct({ name: Schema.String, slug: Schema.String }), {
    strict: true,
    decode: (name) => ({ name, slug: toSlug(name) }),
    encode: ({ name }) => name,
  }),
);

/**
 * Validates a header/footer component name: accepts any string that is safe for a
 * directory name and HTML comment embedding — same rules as stage names. Header and
 * footer names are branding strings (e.g. "Corporate Header"), not AM-driven
 * identifiers, so there is no naming-convention constraint.
 */
export const HeaderFooterNameSchema = Schema.String.pipe(
  Schema.filter(
    (s) =>
      s.length >= 2 &&
      /[A-Za-z]/.test(s) &&
      !s.includes('\0') &&
      !/[\n\r]/.test(s) &&
      !/^\.\.?[/\\]/.test(s),
  ),
  Schema.transform(Schema.Struct({ name: Schema.String, slug: Schema.String }), {
    strict: true,
    decode: (name) => ({ name, slug: toSlug(name) }),
    encode: ({ name }) => name,
  }),
);

/**
 * Resolves the templates directory relative to this file.
 * In the compiled output (dist/src/commands/) the templates live one level up
 * at dist/src/templates/. In Vitest (src/commands/) they live two levels up at
 * the workspace root templates/ directory — the same fallback pattern used in mcp.ts.
 */
function getTemplatesDir(): string {
  const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));
  const compiledPath = nodePath.join(__dirname, '../templates');
  return existsSync(compiledPath) ? compiledPath : nodePath.join(__dirname, '../../templates');
}

/** Supported custom component types for scaffolding. */
type ScaffoldType = 'callback' | 'stage' | 'header' | 'footer';

export function scaffoldComponent(type: ScaffoldType, name: string, directory?: string) {
  return Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const p = yield* Path.Path;

    // ── Guard: validate component name format ─────────────────────────────
    // Callbacks must be valid  name (PascalCase, alphanumeric only).
    // Stages, headers, and footers are arbitrary strings with no naming
    // convention constraint.
    const nameSchema =
      type === 'callback'
        ? CallbackNameSchema
        : type === 'stage'
        ? StageNameSchema
        : HeaderFooterNameSchema;
    const { slug } = yield* Schema.decode(nameSchema)(name).pipe(
      Effect.mapError(() => new InvalidComponentNameError({ name })),
    );

    const cwd = p.resolve(expandTilde(directory ?? process.cwd()));

    // ── Guard: must be run from an initialized project root ───────────────
    yield* assertValidProject(cwd);

    const subDirs: Record<ScaffoldType, string> = {
      callback: 'callbacks',
      footer: 'footers',
      header: 'headers',
      stage: 'stages',
    };
    const componentDir = p.join(cwd, CUSTOM_DIR, subDirs[type], slug);
    const templatesDir = p.join(getTemplatesDir(), type);

    // ── Guard: prevent overwriting an existing component ──────────────────
    const exists = yield* fs.exists(componentDir);
    if (exists) {
      yield* Effect.fail(new ComponentAlreadyExistsError({ path: componentDir }));
    }

    yield* Console.log(`\nGenerating ${type} component: ${name}\n`);

    // ── Create component directory ─────────────────────────────────────────
    yield* fs.makeDirectory(componentDir, { recursive: true });

    // ── Copy and process template files ───────────────────────────────────
    // Each file name contains __COMPONENT_SLUG__; its contents contain both
    // __COMPONENT_NAME__ (PascalCase) and __COMPONENT_SLUG__ (kebab-case).
    const templateFiles = yield* fs.readDirectory(templatesDir);
    const createdFiles: string[] = [];

    for (const templateFile of templateFiles) {
      const targetFileName = templateFile.replaceAll('__COMPONENT_SLUG__', slug);
      const sourceContent = yield* fs.readFileString(p.join(templatesDir, templateFile));
      const pascalName = toPascalCase(name);
      const processedContent = sourceContent
        .replaceAll('__COMPONENT_NAME_PASCAL__', pascalName)
        .replaceAll('__COMPONENT_NAME__', name)
        .replaceAll('__COMPONENT_SLUG__', slug);

      const targetPath = p.join(componentDir, targetFileName);
      yield* fs.writeFileString(targetPath, processedContent);
      createdFiles.push(targetPath);
    }

    // ── Regenerate custom-registry.ts ────────────────────────────────────
    yield* Console.log('Regenerating custom component registry...');
    yield* runRegistryScript(cwd);

    // ── Print summary ──────────────────────────────────────────────────────
    yield* Console.log(
      `Done. ${type} component scaffolded successfully.\n\n` +
        `Files created:\n` +
        createdFiles.map((f) => `  ${f}`).join('\n') +
        `\n\nNext: open ${p.join(componentDir, `${slug}.svelte`)} and implement your component.\n`,
    );
  });
}

// ── Subcommands ──────────────────────────────────────────────────────────────

const generateCallbackCommand = Command.make(
  'callback',
  {
    name: Args.text({ name: 'Name' }).pipe(
      Args.withDescription(
        'PascalCase component name (e.g. MyCallback). Must match the callback type string your AM node sends.',
      ),
    ),
  },
  ({ name }) => scaffoldComponent('callback', name),
).pipe(
  Command.withDescription(
    'Scaffold a new custom callback component under experimental/custom/callbacks/.',
  ),
);

const generateStageCommand = Command.make(
  'stage',
  {
    name: Args.text({ name: 'Name' }).pipe(
      Args.withDescription(
        'Stage name as configured on your AM journey Page Node (e.g. "DefaultLogin" or "My Login Stage"). Any non-empty string is accepted — stage names in AM are arbitrary and not constrained to PascalCase.',
      ),
    ),
  },
  ({ name }) => scaffoldComponent('stage', name),
).pipe(
  Command.withDescription(
    'Scaffold a new custom stage component under experimental/custom/stages/.',
  ),
);

const generateHeaderCommand = Command.make(
  'header',
  {
    name: Args.text({ name: 'Name' }).pipe(
      Args.withDescription(
        'Display name for the header (e.g. "Corporate Header"). Rendered in the registry under this name — set PUBLIC_CUSTOM_HEADER_NAME in the login-app to select it.',
      ),
    ),
  },
  ({ name }) => scaffoldComponent('header', name),
).pipe(
  Command.withDescription(
    'Scaffold a new custom header component under experimental/custom/headers/.',
  ),
);

const generateFooterCommand = Command.make(
  'footer',
  {
    name: Args.text({ name: 'Name' }).pipe(
      Args.withDescription(
        'Name for the footer (e.g. "Corporate Footer"). Registered under this name — set PUBLIC_CUSTOM_FOOTER_NAME in the login-app to select it.',
      ),
    ),
  },
  ({ name }) => scaffoldComponent('footer', name),
).pipe(
  Command.withDescription(
    'Scaffold a new custom footer component under experimental/custom/footers/.',
  ),
);

export const generateCommand = Command.make('generate', {}, () =>
  Effect.gen(function* () {
    const type = yield* Prompt.select({
      message: 'Select component type',
      choices: [
        {
          title: 'callback',
          value: 'callback' as const,
          description: 'Custom AM callback renderer',
        },
        { title: 'stage', value: 'stage' as const, description: 'Custom journey stage layout' },
        { title: 'header', value: 'header' as const, description: 'Custom page header slot' },
        { title: 'footer', value: 'footer' as const, description: 'Custom page footer slot' },
      ],
    });
    const name = yield* Prompt.text({
      message:
        type === 'callback'
          ? 'Callback name (PascalCase name, e.g. MyCallback)'
          : type === 'stage'
          ? 'Stage name (as set on your AM Page Node, e.g. DefaultLogin or My Login Stage)'
          : `Name (branding name for the ${type}, e.g. Corporate ${
              type === 'header' ? 'Header' : 'Footer'
            })`,
    });
    yield* scaffoldComponent(type, name);
  }),
).pipe(
  Command.withDescription(
    'Scaffold a new custom callback, stage, header, or footer component from a template.',
  ),
  Command.withSubcommands([
    generateCallbackCommand,
    generateFooterCommand,
    generateHeaderCommand,
    generateStageCommand,
  ]),
);
