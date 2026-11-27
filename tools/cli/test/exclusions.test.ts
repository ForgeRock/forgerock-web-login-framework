import { describe, expect, it } from 'vitest';

import { isExcluded, isSandboxPath } from '../src/config/exclusions.js';

describe('isExcluded', () => {
  it('excludes known files', () => {
    expect(isExcluded('.env')).toBe(true);
    expect(isExcluded('pnpm-lock.yaml')).toBe(true);
    expect(isExcluded('CLAUDE.md')).toBe(true);
    expect(isExcluded('.generator-version')).toBe(true);
    expect(isExcluded('tsconfig.json')).toBe(true);
  });

  it('excludes directory entries themselves (not just their contents)', () => {
    expect(isExcluded('.git')).toBe(true);
    expect(isExcluded('.github')).toBe(true);
    expect(isExcluded('.changeset')).toBe(true);
    expect(isExcluded('.husky')).toBe(true);
    expect(isExcluded('.vscode')).toBe(true);
    expect(isExcluded('.svelte-kit')).toBe(true);
    expect(isExcluded('node_modules')).toBe(true);
    expect(isExcluded('storybook-static')).toBe(true);
    expect(isExcluded('specs')).toBe(true);
  });

  it('excludes known directory prefixes (files inside excluded dirs)', () => {
    expect(isExcluded('.git/HEAD')).toBe(true);
    expect(isExcluded('node_modules/react/index.js')).toBe(true);
    expect(isExcluded('.github/workflows/ci.yml')).toBe(true);
    expect(isExcluded('storybook-static/index.html')).toBe(true);
  });

  it('excludes the entire tools/ directory from customer projects', () => {
    expect(isExcluded('tools')).toBe(true);
    expect(isExcluded('tools/cli/src/main.ts')).toBe(true);
    expect(isExcluded('tools/cli/package.json')).toBe(true);
    expect(isExcluded('tools/cli/dist/src/main.js')).toBe(true);
    expect(isExcluded('tools/cli/node_modules/foo')).toBe(true);
  });

  it('excludes nested node_modules in workspaces', () => {
    expect(isExcluded('apps/login-app/node_modules')).toBe(true);
    expect(isExcluded('apps/login-app/node_modules/react/index.js')).toBe(true);
    expect(isExcluded('packages/login-widget/node_modules')).toBe(true);
    expect(isExcluded('e2e/node_modules')).toBe(true);
  });

  it('excludes framework-internal root files', () => {
    expect(isExcluded('seed.spec.ts')).toBe(true);
    expect(isExcluded('CONTRIBUTING.md')).toBe(true);
    expect(isExcluded('TESTING.md')).toBe(true);
    expect(isExcluded('bashrc')).toBe(true);
    expect(isExcluded('docker-compose.yml')).toBe(true);
    expect(isExcluded('Dockerfile')).toBe(true);
    expect(isExcluded('release.tar.gz')).toBe(true);
  });

  it('excludes node_modules, dist, dist-server, and .DS_Store at any depth', () => {
    // Root-anchored prefixes miss a dev checkout's nested build noise: a
    // --local init or update would otherwise ship core/node_modules (pnpm's
    // symlink farm), themes/dist, or core/dist-server into a customer
    // project. Segment matching covers every depth and cannot false-positive
    // on names like dist-utils or distributed.ts (whole segments compare).
    expect(isExcluded('core/node_modules/x')).toBe(true);
    expect(isExcluded('themes/node_modules')).toBe(true);
    expect(isExcluded('themes/dist/x')).toBe(true);
    expect(isExcluded('core/dist-server/index.js')).toBe(true);
    expect(isExcluded('.DS_Store')).toBe(true);
    expect(isExcluded('deep/nested/.DS_Store')).toBe(true);
    // Same-name fragments are safe: only whole segments match.
    expect(isExcluded('dist-utils/helper.ts')).toBe(false);
    expect(isExcluded('core/distributed.ts')).toBe(false);
  });

  it('excludes the experimental directory (root-anchored)', () => {
    // The framework's own experiments (editor PoC and friends) are
    // contributor-local and never ship.
    expect(isExcluded('experimental')).toBe(true);
    expect(isExcluded('experimental/anything')).toBe(true);
    expect(isExcluded('experimental/editor-poc/index.html')).toBe(true);
  });

  it('excludes the framework root .gitignore from customer copies', () => {
    // The framework .gitignore ignores the custom/ sandbox (developer-local
    // content in the framework repo). Copied verbatim, it would make
    // `git add -A` in a scaffolded project silently drop generated customer
    // components, stages, callbacks, and wrapper files. init writes the
    // customer .gitignore from templates/gitignore instead, and update must
    // never overwrite the customer's file.
    expect(isExcluded('.gitignore')).toBe(true);
    // Nested .gitignore files (only .husky/ has one in this repo) are covered
    // by their excluded parent prefixes, not by this exact-file rule.
    expect(isExcluded('.husky/.gitignore')).toBe(true);
  });

  it('excludes paths matching patterns', () => {
    expect(isExcluded('.env.production')).toBe(true);
    expect(isExcluded('.env.local')).toBe(true);
    expect(isExcluded('packages/login-widget/dist/index.d.ts')).toBe(true);
  });

  it('excludes env files at any depth, not just the root', () => {
    // Nested env files carry real connection values (apps/login-app/.env is a
    // tracked-until-ignored example); a root-anchored pattern ships them.
    expect(isExcluded('apps/login-app/.env')).toBe(true);
    expect(isExcluded('apps/login-app/.env.local')).toBe(true);
    expect(isExcluded('packages/foo/.env.production')).toBe(true);
    expect(isExcluded('deeply/nested/dir/.env')).toBe(true);
  });

  it('excludes repo-root contributor docs from customer projects', () => {
    // Ship-or-skip rule: repo-root docs are contributor-facing and never
    // ship. The framework's README, agent guides (CLAUDE.md, AGENTS.md,
    // GEMINI.md), and repo-scoped tool configs describe THIS repository, so
    // a customer project must never receive them. init writes a fresh,
    // customer-facing README from templates/readme.md instead.
    expect(isExcluded('README.md')).toBe(true);
    expect(isExcluded('AGENTS.md')).toBe(true);
    expect(isExcluded('GEMINI.md')).toBe(true);
    expect(isExcluded('.stignore')).toBe(true);
    expect(isExcluded('.whitesource')).toBe(true);
    expect(isExcluded('.lighthouserc.cjs')).toBe(true);
    // The rule is root-anchored: a sandbox doc with the same basename is
    // customer-owned and ships (the sandbox allow/deny is decided first).
    expect(isExcluded('custom/components/README.md')).toBe(false);
  });

  it('excludes the repo-local e2e canary from customer projects', () => {
    expect(isExcluded('custom/components/stages/e2e-canary/e2e-canary.svelte')).toBe(true);
    expect(isSandboxPath('custom/components/stages/e2e-canary/e2e-canary.svelte')).toBe(true);
    // A customer's own stage is untouched.
    expect(isExcluded('custom/components/stages/login/login.svelte')).toBe(false);
  });

  it('excludes secret-bearing files at any depth', () => {
    expect(isExcluded('certs/server.pem')).toBe(true);
    expect(isExcluded('certs/server.key')).toBe(true);
    expect(isExcluded('deploy/keystore.p12')).toBe(true);
    expect(isExcluded('config/credentials')).toBe(true);
    expect(isExcluded('config/credentials.json')).toBe(true);
    expect(isExcluded('.env.example')).toBe(false);
    expect(isExcluded('.env.docker.example')).toBe(false);
  });

  it('does not exclude files on the allowlist', () => {
    expect(isExcluded('.env.example')).toBe(false);
    expect(isExcluded('.env.docker.example')).toBe(false);
  });

  it('does not exclude normal source files', () => {
    expect(isExcluded('packages/login-widget/src/lib/index.svelte')).toBe(false);
    expect(isExcluded('core/journey/_utilities/map-stage.utilities.ts')).toBe(false);
    expect(isExcluded('custom/components/README.md')).toBe(false);
  });
});

describe('isSandboxPath', () => {
  it('matches the entire custom/ tree, any depth', () => {
    expect(isSandboxPath('custom')).toBe(true);
    expect(isSandboxPath('custom/components')).toBe(true);
    expect(isSandboxPath('custom/components/README.md')).toBe(true);
    expect(isSandboxPath('custom/components/login-framework.ts')).toBe(true);
    expect(isSandboxPath('custom/components/demo/stages/custom-login/custom-login.svelte')).toBe(
      true,
    );
    expect(isSandboxPath('custom/components/callbacks/my-callback/my-callback.svelte')).toBe(true);
    expect(isSandboxPath('custom/components/layout/header.svelte')).toBe(true);
  });

  it('matches future custom/ siblings (e.g. custom/theme) for free', () => {
    expect(isSandboxPath('custom/theme')).toBe(true);
    expect(isSandboxPath('custom/theme/colors.ts')).toBe(true);
  });

  it('does not match similarly-named paths outside custom/', () => {
    expect(isSandboxPath('customize')).toBe(false);
    expect(isSandboxPath('src/custom/helper.ts')).toBe(false);
    expect(isSandboxPath('core/journey/registry.ts')).toBe(false);
    expect(isSandboxPath('')).toBe(false);
  });
});
