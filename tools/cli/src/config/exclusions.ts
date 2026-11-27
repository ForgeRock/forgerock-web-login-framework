const EXCLUDED_PREFIXES = [
  '.git/',
  '.github/',
  '.changeset/',
  '.claude/',
  '.husky/',
  '.vscode/',
  '.playwright-mcp/',
  '.svelte-kit/',
  'node_modules/',
  'storybook-static/',
  'packages/login-widget/dist/',
  'packages/login-widget/svelte-package/',
  'packages/login-widget/node_modules/',
  'apps/login-app/build/',
  'apps/login-app/.svelte-kit/',
  'apps/login-app/node_modules/',
  'e2e/node_modules/',
  'e2e/test-results/',
  'e2e/playwright-report/',
  'e2e/blob-report/',
  'docs/',
  'specs/',
  'tools/',
  // Repo-local e2e fixture inside the sandbox: proves the custom-stage
  // pipeline in the framework repo's Playwright suite. Never meaningful in a
  // customer project, and `includeSandbox` (init) would otherwise copy it.
  'custom/components/stages/e2e-canary/',
] as const;

const EXCLUDED_FILES = [
  '.env',
  '.mcp.json',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  // The framework .gitignore ignores the customer sandbox (custom/ component
  // trees are developer-local in the framework repo). Shipped into a
  // scaffolded project, those rules would hide generated customer components
  // and wrapper files from `git add -A` and CI. init writes the customer
  // .gitignore from templates/gitignore instead; update must never overwrite
  // the customer's own file.
  '.gitignore',
  'CLAUDE.md',
  '.generator-version',
  'pnpm-workspace.yaml',
  'tsconfig.json',
  'bashrc',
  'CONTRIBUTING.md',
  'TESTING.md',
  'seed.spec.ts',
  'docker-compose.yml',
  'Dockerfile',
  'release.tar.gz',
] as const;

const EXCLUDED_PATTERNS = [
  // Env files at ANY depth, not just the root: `apps/login-app/.env` (and any
  // nested `.env.*`) carries real AM connection values and must never ship to
  // a customer project via init or update. Root-anchored patterns
  // (`/^\.env\..*/`) miss every subdirectory env file.
  /(^|\/)\.env\..*/,
  /(^|\/)\.env$/,
  /\.(pem|key|p12|pfx)$/,
  /(^|\/)credentials(\..*)?$/,
  /\.d\.ts$/,
] as const;

const ALLOW_LIST = ['.env.example', '.env.docker.example'] as const;

import { normalizeSeparators } from '../utils.js';

/**
 * Path prefixes the framework never ships and the CLI copy must never write:
 * the customer sandbox. Everything under `custom/` is customer-owned code and
 * docs — components, theme, demo, README. A default-deny prefix (rather than a
 * deny-list of known subpaths) means a file the framework adds under `custom/`
 * in a future release is skipped automatically; new sandbox siblings like
 * `custom/theme/` are covered with no code change. `ping-lf init` is the only
 * flow allowed to write inside the sandbox (it creates the project and its
 * initial `custom/` tree from the framework source, via `includeSandbox`).
 */
const SANDBOX_PREFIXES = ['custom/'] as const;

/**
 * True when the given project-relative path lives inside the customer
 * sandbox. Framework-side flows (`ping-lf update`, MCP `update`) must never
 * write to a path where this returns true.
 */
export function isSandboxPath(relativePath: string): boolean {
  const normalized = normalizeSeparators(relativePath);
  return SANDBOX_PREFIXES.some((prefix) => `${normalized}/`.startsWith(prefix));
}

export function isExcluded(relativePath: string): boolean {
  const normalized = normalizeSeparators(relativePath);
  if (ALLOW_LIST.some((allowed) => normalized === allowed)) {
    return false;
  }
  if (EXCLUDED_FILES.some((file) => normalized === file)) {
    return true;
  }
  if (EXCLUDED_PREFIXES.some((prefix) => `${normalized}/`.startsWith(prefix))) {
    return true;
  }
  if (EXCLUDED_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }
  return false;
}
