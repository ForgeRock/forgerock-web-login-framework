const EXCLUDED_PREFIXES = [
  '.git/',
  '.github/',
  '.changeset/',
  '.claude/',
  '.husky/',
  '.vscode/',
  '.playwright-mcp/',
  'node_modules/',
  'storybook-static/',
  'packages/login-widget/dist/',
  'packages/login-widget/svelte-package/',
  'apps/login-app/build/',
  'apps/login-app/.svelte-kit/',
  'e2e/test-results/',
  'e2e/playwright-report/',
  'e2e/blob-report/',
  'docs/',
  'specs/',
  'tools/',
] as const;

const EXCLUDED_FILES = [
  '.env',
  '.mcp.json',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'CLAUDE.md',
  '.generator-version',
  'pnpm-workspace.yaml',
  'tsconfig.json',
] as const;

const EXCLUDED_PATTERNS = [/^\.env\..*/, /\.d\.ts$/] as const;

const ALLOW_LIST = ['.env.example', '.env.docker.example'] as const;

export function isExcluded(relativePath: string): boolean {
  if (ALLOW_LIST.some((allowed) => relativePath === allowed)) {
    return false;
  }
  if (EXCLUDED_FILES.some((file) => relativePath === file)) {
    return true;
  }
  if (EXCLUDED_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) {
    return true;
  }
  if (EXCLUDED_PATTERNS.some((pattern) => pattern.test(relativePath))) {
    return true;
  }
  return false;
}
