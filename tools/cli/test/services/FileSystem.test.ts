import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Effect } from 'effect';
import { NodeContext } from '@effect/platform-node';
import { copyWithExclusions } from '../../src/services/FileSystem.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('copyWithExclusions', () => {
  let sourceDir: string;
  let targetDir: string;

  beforeEach(() => {
    sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'law-src-'));
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'law-tgt-'));

    fs.mkdirSync(path.join(sourceDir, 'core/journey'), { recursive: true });
    fs.mkdirSync(path.join(sourceDir, '.github/workflows'), {
      recursive: true,
    });
    fs.mkdirSync(path.join(sourceDir, '.changeset'), { recursive: true });

    fs.writeFileSync(path.join(sourceDir, 'core/journey/journey.svelte'), '<p>framework</p>');
    fs.writeFileSync(path.join(sourceDir, '.github/workflows/ci.yml'), 'name: CI');
    fs.writeFileSync(path.join(sourceDir, '.changeset/config.json'), '{}');
    fs.writeFileSync(path.join(sourceDir, 'package.json'), '{}');
    fs.writeFileSync(path.join(sourceDir, '.npmrc'), 'auto-install-peers=true');
  });

  afterEach(() => {
    fs.rmSync(sourceDir, { recursive: true, force: true });
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('copies non-excluded files', () =>
    copyWithExclusions(sourceDir, targetDir).pipe(
      Effect.andThen(() => {
        expect(fs.existsSync(path.join(targetDir, 'core/journey/journey.svelte'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, '.npmrc'))).toBe(true);
      }),
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    ));

  it('skips excluded files', () =>
    copyWithExclusions(sourceDir, targetDir).pipe(
      Effect.andThen(() => {
        expect(fs.existsSync(path.join(targetDir, '.github/workflows/ci.yml'))).toBe(false);
        expect(fs.existsSync(path.join(targetDir, '.changeset/config.json'))).toBe(false);
      }),
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    ));

  it('never overwrites /user directory', () => {
    fs.mkdirSync(path.join(targetDir, 'user/callback/my-cb'), {
      recursive: true,
    });
    fs.writeFileSync(path.join(targetDir, 'user/callback/my-cb/component.svelte'), 'custom');

    return copyWithExclusions(sourceDir, targetDir).pipe(
      Effect.andThen(() => {
        expect(
          fs.readFileSync(path.join(targetDir, 'user/callback/my-cb/component.svelte'), 'utf-8'),
        ).toBe('custom');
      }),
      Effect.provide(NodeContext.layer),
      Effect.runPromise,
    );
  });
});
