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

  it('excludes paths matching patterns', () => {
    expect(isExcluded('.env.production')).toBe(true);
    expect(isExcluded('.env.local')).toBe(true);
    expect(isExcluded('packages/login-widget/dist/index.d.ts')).toBe(true);
  });

  it('does not exclude files on the allowlist', () => {
    expect(isExcluded('.env.example')).toBe(false);
    expect(isExcluded('.env.docker.example')).toBe(false);
  });

  it('does not exclude normal source files', () => {
    expect(isExcluded('packages/login-widget/src/lib/index.svelte')).toBe(false);
    expect(isExcluded('core/journey/_utilities/map-stage.utilities.ts')).toBe(false);
    expect(isExcluded('custom/components/README.md')).toBe(false);
    expect(isExcluded('README.md')).toBe(false);
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
