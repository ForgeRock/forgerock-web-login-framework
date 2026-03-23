/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * Recursively scans /experimental/custom/stages/ and /experimental/custom/callbacks/ for custom Svelte
 * components, validates their @component headers, and generates
 * core/journey/_utilities/custom-registry.ts so the runtime stage and
 * callback mappers can consume them statically.
 *
 * Usage: node scripts/generateCustomRegistry.mjs  (from repo root)
 *        node ../../scripts/generateCustomRegistry.mjs  (from packages/login-widget)
 * Errors: exits with code 1 and a descriptive message on any validation failure.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// scripts/ is at repo root — repo root is one level up from __dirname
const repoRoot = join(__dirname, '..');
const stageDir = join(repoRoot, 'experimental', 'custom', 'stages');
const callbackDir = join(repoRoot, 'experimental', 'custom', 'callbacks');
const registryPath = join(repoRoot, 'core', 'journey', '_utilities', 'custom-registry.ts');
const registryDir = dirname(registryPath);

/**
 * Recursively finds all *.svelte files under a directory.
 * Returns an empty array if the directory does not exist.
 */
function findSvelteFiles(dir) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSvelteFiles(fullPath));
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.svelte') &&
      !entry.name.endsWith('.story.svelte')
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Extracts the names of all `export let` prop declarations from a Svelte
 * component's <script> block. Used to populate `acceptedProps` in the
 * registry so callback-mapper can forward only the props the component
 * actually declared, eliminating the need for `export const = null` boilerplate.
 *
 * @param {string} content - Full file content of the .svelte component
 * @returns {string[]} List of prop names declared with `export let`
 */
function parseAcceptedProps(content) {
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (!scriptMatch) return [];
  const props = [];
  const regex = /export\s+let\s+(\w+)/g;
  let m;
  while ((m = regex.exec(scriptMatch[1])) !== null) {
    props.push(m[1]);
  }
  return props;
}

/**
 * Parses the leading <!-- @component --> block from a Svelte file.
 * Returns { type, name }.
 * Throws a descriptive error if the header is missing or malformed.
 *
 * @param {string} filePath - Path used only for error messages
 * @param {string} content - Pre-read file content
 */
function parseComponentHeader(filePath, content) {
  const commentMatch = content.match(/^<!--([\s\S]*?)-->/);
  if (!commentMatch) {
    throw new Error(
      `\nMissing @component header in:\n   ${filePath}\n\n` +
        `Every custom component must begin with:\n` +
        `<!--\n   @component\n   Type: stage|callback\n   Name: <ComponentName>\n   -->`,
    );
  }

  const block = commentMatch[1];

  if (!block.includes('@component')) {
    throw new Error(
      `\nMissing "@component" tag in the opening comment of:\n   ${filePath}\n\n` +
        `Add "@component" on its own line inside the comment block.`,
    );
  }

  const typeMatch = block.match(/Type:\s*(\S+)/);
  if (!typeMatch) {
    throw new Error(
      `\nMissing "Type:" field in @component header of:\n   ${filePath}\n\n` +
        `Expected one of:\n   Type: stage\n   Type: callback`,
    );
  }

  const type = typeMatch[1].toLowerCase();
  if (type !== 'stage' && type !== 'callback') {
    throw new Error(
      `\nInvalid Type value "${typeMatch[1]}" in @component header of:\n   ${filePath}\n\n` +
        `Must be exactly "stage" or "callback".`,
    );
  }

  const nameMatch = block.match(/Name:\s*(\S+)/);
  if (!nameMatch) {
    throw new Error(
      `\nMissing "Name:" field in @component header of:\n   ${filePath}\n\n` +
        `Expected: Name: <ComponentName>  (e.g. Name: DefaultLogin)`,
    );
  }

  return { type, name: nameMatch[1] };
}

/**
 * Converts any string to PascalCase for use as a JavaScript identifier.
 * Examples: "custom-login" → "CustomLogin", "NameCallback" → "NameCallback"
 */
function toPascalCase(str) {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^(.)/, (_, chr) => chr.toUpperCase());
}

// ---------------------------------------------------------------------------
// Scan /experimental/custom/stages/ and /experimental/custom/callbacks/
// ---------------------------------------------------------------------------

const stageComponents = [];
const callbackComponents = [];
let errorCount = 0;

for (const filePath of findSvelteFiles(stageDir)) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const { type, name } = parseComponentHeader(filePath, content);
    if (type !== 'stage') {
      throw new Error(
        `\nComponent inside /experimental/custom/stages/ declares Type: "${type}" in:\n   ${filePath}\n\n` +
          `Components under /experimental/custom/stages/ must declare Type: stage`,
      );
    }
    const acceptedProps = parseAcceptedProps(content);
    stageComponents.push({ filePath, name, acceptedProps });
  } catch (err) {
    console.error(err.message);
    errorCount++;
  }
}

for (const filePath of findSvelteFiles(callbackDir)) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const { type, name } = parseComponentHeader(filePath, content);
    if (type !== 'callback') {
      throw new Error(
        `\nComponent inside /experimental/custom/callbacks/ declares Type: "${type}" in:\n   ${filePath}\n\n` +
          `Components under /experimental/custom/callbacks/ must declare Type: callback`,
      );
    }
    const acceptedProps = parseAcceptedProps(content);
    callbackComponents.push({ filePath, name, acceptedProps });
  } catch (err) {
    console.error(err.message);
    errorCount++;
  }
}

if (errorCount > 0) {
  console.error(
    `\nFound ${errorCount} error(s) in /experimental/custom/ components. Fix the above and re-run the build.`,
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Generate import entries
// ---------------------------------------------------------------------------

const stageEntries = stageComponents.map(({ filePath, name, acceptedProps }) => {
  const relPath = relative(registryDir, filePath).replace(/\\/g, '/');
  const importPath = relPath.startsWith('.') ? relPath : `./${relPath}`;
  const varName = `Stage${toPascalCase(name)}`;
  return { varName, importPath, name, acceptedProps };
});

const callbackEntries = callbackComponents.map(({ filePath, name, acceptedProps }) => {
  const relPath = relative(registryDir, filePath).replace(/\\/g, '/');
  const importPath = relPath.startsWith('.') ? relPath : `./${relPath}`;
  const varName = `Callback${toPascalCase(name)}`;
  return { varName, importPath, name, acceptedProps };
});

// ---------------------------------------------------------------------------
// Build file content
// ---------------------------------------------------------------------------

const lines = [
  `/**`,
  ` * AUTO-GENERATED — do not edit by hand.`,
  ` * Run \`node scripts/generateCustomRegistry.mjs\``,
  ` * or \`pnpm build:widget\` to regenerate.`,
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
  for (const { varName, importPath } of stageEntries) {
    lines.push(`import ${varName} from '${importPath}';`);
  }
  lines.push(``);
}

if (callbackEntries.length > 0) {
  lines.push(`// Callback overrides / extensions`);
  for (const { varName, importPath } of callbackEntries) {
    lines.push(`import ${varName} from '${importPath}';`);
  }
  lines.push(``);
}

lines.push(`export const customStageRegistry: Record<string, CustomRegistryEntry> = {`);
for (const { varName, name, acceptedProps } of stageEntries) {
  lines.push(
    `  ${JSON.stringify(name)}: { component: ${varName}, acceptedProps: ${JSON.stringify(
      acceptedProps,
    )} },`,
  );
}
lines.push(`};`);
lines.push(``);

lines.push(`export const customCallbackRegistry: Record<string, CustomRegistryEntry> = {`);
for (const { varName, name, acceptedProps } of callbackEntries) {
  lines.push(
    `  ${JSON.stringify(name)}: { component: ${varName}, acceptedProps: ${JSON.stringify(
      acceptedProps,
    )} },`,
  );
}
lines.push(`};`);
lines.push(``);

// ---------------------------------------------------------------------------
// Write file + summary
// ---------------------------------------------------------------------------

writeFileSync(registryPath, lines.join('\n'), 'utf-8');

const total = stageComponents.length + callbackComponents.length;
if (total === 0) {
  console.log(`custom-registry.ts generated (no custom components found — registries are empty)`);
} else {
  console.log(`custom-registry.ts generated:`);
  if (stageComponents.length > 0) {
    console.log(
      `  Stages    (${stageComponents.length}): ${stageComponents.map((c) => c.name).join(', ')}`,
    );
  }
  if (callbackComponents.length > 0) {
    console.log(
      `  Callbacks (${callbackComponents.length}): ${callbackComponents
        .map((c) => c.name)
        .join(', ')}`,
    );
  }
}
