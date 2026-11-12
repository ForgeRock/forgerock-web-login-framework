import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface PackageManifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const packageManifest = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as PackageManifest;

describe('@forgerock/login-widget package manifest', () => {
  it('installs Svelte for framework-agnostic TypeScript consumers', () => {
    expect(packageManifest.dependencies?.svelte).toBe('^5.55.7');
    expect(packageManifest.devDependencies?.svelte).toBeUndefined();
  });
});
