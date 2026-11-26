import { NodeContext } from '@effect/platform-node';
import { it } from '@effect/vitest';
import { Effect } from 'effect';
import { Schema } from 'effect';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';

// Test-only cross-package import: the boundary checker that compiles the
// customer source is the same checker the scaffolded output must pass.
// Relative source path (not the workspace package export) so the CLI test run
// does not depend on build:framework having produced core/dist. Excluded from
// the published package (files: ["dist"]) and from tsc (tsconfig include: src).
import { scanCustomComponents } from '../../../core/custom-imports.js';
import {
  CallbackNameSchema,
  scaffoldComponent,
  StageNameSchema,
} from '../src/commands/generate.js';

import type { FileSystem, Path } from '@effect/platform';

// ── Helpers for integration tests ──────────────────────────────────────────

const runEffect = <A, E>(eff: Effect.Effect<A, E, FileSystem.FileSystem | Path.Path>) =>
  Effect.runPromise(Effect.provide(eff, NodeContext.layer) as Effect.Effect<A, E, never>);

/** Creates the minimal on-disk structure that `scaffoldComponent` requires. */
async function createMinimalProject(dir: string): Promise<void> {
  // .generator-version required by assertValidProject
  await writeFile(
    join(dir, '.generator-version'),
    JSON.stringify({ version: '1.0.0', generatedAt: new Date().toISOString() }) + '\n',
    'utf8',
  );
  // empty custom component dirs (scaffoldComponent scans these)
  await mkdir(join(dir, 'custom', 'components', 'callbacks'), { recursive: true });
  await mkdir(join(dir, 'custom', 'components', 'stages'), { recursive: true });
  // registry output dir (the framework's Vite plugin writes custom-registry.ts here)
  await mkdir(join(dir, 'core', 'journey', '_utilities', 'registry'), { recursive: true });
}

// ── Schema helpers ─────────────────────────────────────────────────────────

const decodeCallback = Schema.decodeSync(CallbackNameSchema);
const decodeStage = Schema.decodeSync(StageNameSchema);

// ── Template substitution integration tests ─────────────────────────────────

describe('scaffoldComponent — template substitution', () => {
  let tmpDir: string;

  beforeEach(async () => {
    const { mkdtemp } = await import('node:fs/promises');
    tmpDir = await mkdtemp(join(tmpdir(), 'ping-lf-gen-test-'));
    await createMinimalProject(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('replaces __COMPONENT_NAME_PASCAL__ in callback template files', async () => {
    await runEffect(scaffoldComponent('callback', 'MyCallback', tmpDir));

    const componentFile = join(
      tmpDir,
      'custom',
      'components',
      'callbacks',
      'my-callback',
      'my-callback.svelte',
    );
    const content = await readFile(componentFile, 'utf8');

    expect(content).not.toContain('__COMPONENT_NAME_PASCAL__');
    expect(content).toContain('MyCallback');
    expect(content).toContain("from '$login-framework'");
    expect(content).not.toContain('@forgerock/javascript-sdk');
  });

  it('replaces __COMPONENT_NAME_PASCAL__ with toPascalCase(name) for stage names with spaces', async () => {
    await runEffect(scaffoldComponent('stage', 'My Login Stage', tmpDir));

    const componentFile = join(
      tmpDir,
      'custom',
      'components',
      'stages',
      'my-login-stage',
      'my-login-stage.svelte',
    );
    const content = await readFile(componentFile, 'utf8');
    const utilityContent = await readFile(
      join(
        tmpDir,
        'custom',
        'components',
        'stages',
        'my-login-stage',
        'my-login-stage.utilities.ts',
      ),
      'utf8',
    );

    expect(content).not.toContain('__COMPONENT_NAME_PASCAL__');
    expect(utilityContent).toContain('formatMyLoginStageLabel');
    expect(content).toContain('Name: My Login Stage');
    expect(content).not.toContain('@forgerock/javascript-sdk');
  });

  it('replaces __COMPONENT_NAME_PASCAL__ in utilities.ts and utilities.test.ts', async () => {
    await runEffect(scaffoldComponent('callback', 'JWTLogin', tmpDir));

    const utilsFile = join(
      tmpDir,
      'custom',
      'components',
      'callbacks',
      'jwt-login',
      'jwt-login.utilities.ts',
    );
    const testFile = join(
      tmpDir,
      'custom',
      'components',
      'callbacks',
      'jwt-login',
      'jwt-login.utilities.test.ts',
    );

    const [utils, test] = await Promise.all([
      readFile(utilsFile, 'utf8'),
      readFile(testFile, 'utf8'),
    ]);

    expect(utils).not.toContain('__COMPONENT_NAME_PASCAL__');
    expect(utils).toContain('formatJWTLoginLabel');
    expect(test).not.toContain('__COMPONENT_NAME_PASCAL__');
    expect(test).toContain('formatJWTLoginLabel');
  });
});

// ── SDKS-5510 boundary + prop-rule tests ─────────────────────────────────────
//
// The scaffolded component source is customer source: it must pass the
// forbidden-import boundary checker exactly like any other file under
// custom/components/, and its prop guidance must match the SDKS-5510 public
// contract (documented props only; runtime commands, not store internals).

describe('scaffoldComponent — SDKS-5510 boundary compliance', () => {
  let tmpDir: string;

  beforeEach(async () => {
    const { mkdtemp } = await import('node:fs/promises');
    tmpDir = await mkdtemp(join(tmpdir(), 'ping-lf-gen-boundary-'));
    await createMinimalProject(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('scaffolded callback passes the forbidden-import boundary check', async () => {
    await runEffect(scaffoldComponent('callback', 'MyCallback', tmpDir));

    const violations = scanCustomComponents(tmpDir);
    expect(violations).toEqual([]);
  });

  it('scaffolded stage passes the forbidden-import boundary check', async () => {
    await runEffect(scaffoldComponent('stage', 'My Login Stage', tmpDir));

    const violations = scanCustomComponents(tmpDir);
    expect(violations).toEqual([]);
  });

  it('boundary check catches a forbidden import in the same tmp tree (sanity)', async () => {
    await runEffect(scaffoldComponent('callback', 'MyCallback', tmpDir));

    const badFile = join(
      tmpDir,
      'custom',
      'components',
      'callbacks',
      'my-callback',
      'my-callback.svelte',
    );
    await writeFile(badFile, `import { styleStore } from '$core/style.store';\n`, 'utf8');

    const violations = scanCustomComponents(tmpDir);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.violations[0]?.kind).toBe('forbidden-alias');
  });
});

describe('scaffoldComponent — SDKS-5510 prop rules in generated templates', () => {
  let tmpDir: string;

  beforeEach(async () => {
    const { mkdtemp } = await import('node:fs/promises');
    tmpDir = await mkdtemp(join(tmpdir(), 'ping-lf-gen-props-'));
    await createMinimalProject(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('callback template documents the documented-prop contract, not SDK internals', async () => {
    await runEffect(scaffoldComponent('callback', 'MyCallback', tmpDir));

    const content = await readFile(
      join(tmpDir, 'custom', 'components', 'callbacks', 'my-callback', 'my-callback.svelte'),
      'utf8',
    );
    // Prop rules: read/write values through the documented callback accessors.
    expect(content).toContain('getInputValue');
    expect(content).toContain('setInputValue');
    // No guidance toward prohibited surfaces.
    expect(content).not.toMatch(/\$core|\$journey|\$components/);
  });

  it('stage template directs submission through form.submit, not store internals', async () => {
    await runEffect(scaffoldComponent('stage', 'My Login Stage', tmpDir));

    const content = await readFile(
      join(tmpDir, 'custom', 'components', 'stages', 'my-login-stage', 'my-login-stage.svelte'),
      'utf8',
    );
    // Prop rules: submit via the documented form prop; no journeyStore access.
    expect(content).toContain('form?.submit');
    expect(content).not.toContain('journeyStore');
    // No guidance toward prohibited surfaces.
    expect(content).not.toMatch(/\$core|\$journey|\$components/);
  });

  it('stage template documents the SDKS-5510 prop rules', async () => {
    await runEffect(scaffoldComponent('stage', 'My Login Stage', tmpDir));

    const content = await readFile(
      join(tmpDir, 'custom', 'components', 'stages', 'my-login-stage', 'my-login-stage.svelte'),
      'utf8',
    );
    // Documented props only: the framework passes exactly the declared props.
    expect(content).toContain('Do not add required props of your own');
    // Submission goes through the documented command, never the journey store.
    expect(content).toContain('form.submit()');
    // journey.loading is authoritative for blocking conflicting actions.
    expect(content).toContain('journey.loading');
  });

  it('callback template documents the SDKS-5510 prop rules', async () => {
    await runEffect(scaffoldComponent('callback', 'MyCallback', tmpDir));

    const content = await readFile(
      join(tmpDir, 'custom', 'components', 'callbacks', 'my-callback', 'my-callback.svelte'),
      'utf8',
    );
    // Documented props only: the framework passes exactly the declared props.
    expect(content).toContain('Do not add required props of your own');
    // Values flow through the documented callback accessors.
    expect(content).toContain('getInputValue');
    expect(content).toContain('setInputValue');
  });

  it('callback and stage templates import Journey Client types through the curated surface', async () => {
    await runEffect(scaffoldComponent('callback', 'MyCallback', tmpDir));
    await runEffect(scaffoldComponent('stage', 'My Login Stage', tmpDir));

    // The curated surface re-exports BaseCallback and JourneyStep; customer
    // source keeps exactly one framework import specifier.
    const componentDirs = [
      join(tmpDir, 'custom', 'components', 'callbacks', 'my-callback'),
      join(tmpDir, 'custom', 'components', 'stages', 'my-login-stage'),
    ];
    for (const componentDir of componentDirs) {
      const files = await import('node:fs/promises').then((fs) => fs.readdir(componentDir));
      for (const file of files) {
        const content = await readFile(join(componentDir, file), 'utf8');
        if (content.includes('BaseCallback') || content.includes('JourneyStep')) {
          expect(content).toContain("from '$login-framework'");
          expect(content).not.toContain("from '@forgerock/journey-client/types'");
        }
      }
    }
  });

  it('stage stories mock uses the runtime form-status values and full journey mock', async () => {
    await runEffect(scaffoldComponent('stage', 'My Login Stage', tmpDir));

    const stories = await readFile(
      join(tmpDir, 'custom', 'components', 'stages', 'my-login-stage', 'my-login-stage.stories.js'),
      'utf8',
    );
    // journey.svelte always sends status 'ok' or 'error' — never ''.
    expect(stories).toContain("status: 'ok'");
    expect(stories).not.toContain("status: ''");
    // StageJourneyObject includes redirect; the mock must carry it.
    expect(stories).toContain('redirect: fn()');
  });

  it('templates do not embed framework-internal alias specifiers', async () => {
    await runEffect(scaffoldComponent('callback', 'MyCallback', tmpDir));
    await runEffect(scaffoldComponent('stage', 'My Login Stage', tmpDir));

    const componentDirs = [
      join(tmpDir, 'custom', 'components', 'callbacks', 'my-callback'),
      join(tmpDir, 'custom', 'components', 'stages', 'my-login-stage'),
    ];
    for (const componentDir of componentDirs) {
      const files = await import('node:fs/promises').then((fs) => fs.readdir(componentDir));
      for (const file of files) {
        const content = await readFile(join(componentDir, file), 'utf8');
        expect(content).not.toMatch(/['"]\$core|['"]\$journey|['"]\$components|['"]\$locales/);
      }
    }
  });
});

describe('CallbackNameSchema', () => {
  describe('valid names — slug generation', () => {
    it('converts simple PascalCase', () => {
      expect(decodeCallback('MyCallback').slug).toBe('my-callback');
      expect(decodeCallback('DefaultLogin').slug).toBe('default-login');
    });

    it('handles acronyms at the end', () => {
      expect(decodeCallback('MyURL').slug).toBe('my-url');
      expect(decodeCallback('ParseJSON').slug).toBe('parse-json');
    });

    it('handles acronyms at the start', () => {
      expect(decodeCallback('JWTCallback').slug).toBe('jwt-callback');
      expect(decodeCallback('OTPLogin').slug).toBe('otp-login');
    });

    it('handles acronyms in the middle', () => {
      expect(decodeCallback('MyURLCallback').slug).toBe('my-url-callback');
      expect(decodeCallback('ParseJSONResponse').slug).toBe('parse-json-response');
    });

    it('handles single-segment names', () => {
      expect(decodeCallback('Login').slug).toBe('login');
    });

    it('does not mistake a single leading capital for an acronym run', () => {
      expect(decodeCallback('OAuth2Login').slug).toBe('oauth2-login');
    });

    it('preserves the original PascalCase name', () => {
      expect(decodeCallback('MyCallback').name).toBe('MyCallback');
    });
  });

  describe('invalid names — Java class names only', () => {
    const reject = (name: string) => expect(() => decodeCallback(name)).toThrow();

    it('rejects empty string', () => reject(''));
    it('rejects single character', () => reject('A'));

    it('rejects names starting with lowercase', () => {
      reject('myCallback');
      reject('callback');
    });

    it('rejects names starting with a digit', () => reject('2FA'));

    it('rejects names with spaces or special characters', () => {
      reject('My Callback');
      reject('My-Callback');
      reject('My/Callback');
      reject('My.Callback');
      reject('../evil');
    });
  });
});

describe('StageNameSchema', () => {
  describe('valid names — AM stage names are arbitrary strings', () => {
    it('accepts PascalCase (common AM convention)', () => {
      expect(decodeStage('DefaultLogin').name).toBe('DefaultLogin');
      expect(decodeStage('DefaultLogin').slug).toBe('default-login');
    });

    it('hyphenates PascalCase stage names at word boundaries', () => {
      expect(decodeStage('MyCustomStage').slug).toBe('my-custom-stage');
    });

    it('accepts names with spaces', () => {
      expect(decodeStage('My Login Stage').slug).toBe('my-login-stage');
      expect(decodeStage('My Login Stage').name).toBe('My Login Stage');
    });

    it('accepts names with hyphens', () => {
      expect(decodeStage('my-login').slug).toBe('my-login');
    });

    it('accepts names with mixed separators', () => {
      expect(decodeStage('OTP Login').slug).toBe('otp-login');
    });

    it('hyphenates acronym runs in PascalCase stage names', () => {
      expect(decodeStage('JWTLoginStage').slug).toBe('jwt-login-stage');
    });

    it('handles digit-adjacent acronym boundaries', () => {
      expect(decodeStage('OAuth2Login').slug).toBe('oauth2-login');
      expect(decodeStage('SAML2Stage').slug).toBe('saml2-stage');
    });

    it('preserves the original name', () => {
      expect(decodeStage('My Stage').name).toBe('My Stage');
    });
  });

  describe('invalid names — path traversal and empty strings rejected', () => {
    const reject = (name: string) => expect(() => decodeStage(name)).toThrow();

    it('rejects empty string', () => reject(''));
    it('rejects single character with no letters', () => reject('1'));
    it('rejects path traversal', () => {
      reject('../evil');
      reject('..\\evil');
    });
    it('rejects newlines', () => reject('My\nStage'));
    it('rejects null bytes', () => reject('My\x00Stage'));
  });
});
