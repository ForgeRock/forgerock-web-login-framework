import { readFileSync } from 'node:fs';
import { VERSION as svelteVersion } from 'svelte/compiler';
import { describe, expect, it } from 'vitest';

interface PackageManifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const packageManifest = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as PackageManifest;

const workspaceYaml = readFileSync(
  new URL('../../../../pnpm-workspace.yaml', import.meta.url),
  'utf8',
);

describe('@forgerock/login-widget package manifest', () => {
  it('installs Svelte for framework-agnostic TypeScript consumers', () => {
    expect(packageManifest.dependencies?.svelte).toBe('catalog:');
    expect(packageManifest.devDependencies?.svelte).toBeUndefined();

    const catalogRange = workspaceYaml.match(/^ {2}svelte: (\S+)$/m)?.[1];
    expect(catalogRange).toBe(`^${svelteVersion}`);
  });
});
