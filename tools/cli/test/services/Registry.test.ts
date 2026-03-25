import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  parseComponentMetadata,
  scanUserDirectory,
  generateRegistrySource,
} from '../../src/services/Registry.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('parseComponentMetadata', () => {
  it('extracts type and name from component comment', () => {
    const source = `<!--
@component
Type: callback
Name: NameCallback
-->
<script>let { callback } = $props();</script>
<main>Hello</main>`;

    const result = parseComponentMetadata(source);
    expect(result).toEqual({ type: 'callback', name: 'NameCallback' });
  });

  it('extracts stage type', () => {
    const source = `<!--
@component
Type: stage
Name: CustomLogin
-->
<script>let { step } = $props();</script>`;

    const result = parseComponentMetadata(source);
    expect(result).toEqual({ type: 'stage', name: 'CustomLogin' });
  });

  it('returns null for missing metadata', () => {
    const source = `<script>let x = 1;</script><p>No metadata</p>`;
    expect(parseComponentMetadata(source)).toBeNull();
  });
});

describe('scanUserDirectory', () => {
  let userDir: string;

  beforeEach(() => {
    userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'law-user-'));

    fs.mkdirSync(path.join(userDir, 'callback/custom-name'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(userDir, 'callback/custom-name/component.svelte'),
      `<!--\n@component\nType: callback\nName: NameCallback\n-->\n<script>let { callback } = $props();</script>\n<p>Custom</p>`,
    );

    fs.mkdirSync(path.join(userDir, 'stage/custom-login'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(userDir, 'stage/custom-login/component.svelte'),
      `<!--\n@component\nType: stage\nName: CustomLogin\n-->\n<script>let { step } = $props();</script>\n<p>Login</p>`,
    );
  });

  afterEach(() => {
    fs.rmSync(userDir, { recursive: true, force: true });
  });

  it('discovers all custom components', () => {
    const components = scanUserDirectory(userDir);
    expect(components).toHaveLength(2);
    expect(components).toContainEqual({
      type: 'callback',
      name: 'NameCallback',
      relativePath: 'callback/custom-name/component.svelte',
    });
    expect(components).toContainEqual({
      type: 'stage',
      name: 'CustomLogin',
      relativePath: 'stage/custom-login/component.svelte',
    });
  });
});

describe('generateRegistrySource', () => {
  it('generates valid TypeScript with imports and exports', () => {
    const components = [
      {
        type: 'callback' as const,
        name: 'NameCallback',
        relativePath: 'callback/custom-name/component.svelte',
      },
      {
        type: 'stage' as const,
        name: 'CustomLogin',
        relativePath: 'stage/custom-login/component.svelte',
      },
    ];

    const source = generateRegistrySource(components);
    expect(source).toContain('import CustomLogin from "$user/stage/custom-login/component.svelte"');
    expect(source).toContain(
      'import NameCallback from "$user/callback/custom-name/component.svelte"',
    );
    expect(source).toContain('export const customStages');
    expect(source).toContain('export const customCallbacks');
    expect(source).toContain('"CustomLogin"');
    expect(source).toContain('"NameCallback"');
  });

  it('generates empty maps when no components', () => {
    const source = generateRegistrySource([]);
    expect(source).toContain('export const customStages = {}');
    expect(source).toContain('export const customCallbacks = {}');
  });
});
