/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

import {
  checkSurface,
  collectRuntimeModules,
  parseSurface,
  surfaceViolations,
} from './login-framework-surface';

const packageRoot = resolve(import.meta.dirname);
const surfaceFile = resolve(packageRoot, '../experimental/custom/login-framework.ts');

describe('parseSurface', () => {
  it('parses every named export with its source', () => {
    const surface = parseSurface(`
export { default as Stacked } from '$components/compositions/input-stacked/stacked-label.svelte';
export { interpolate, textToKey } from '$core/_utilities/i18n.utilities';
export type { Maybe } from '$core/interfaces';
`);
    expect(surface).toHaveLength(3);
    expect(surface[0]).toEqual({
      names: ['Stacked'],
      source: '$components/compositions/input-stacked/stacked-label.svelte',
      typeOnly: false,
    });
    expect(surface[1]).toEqual({
      names: ['interpolate', 'textToKey'],
      source: '$core/_utilities/i18n.utilities',
      typeOnly: false,
    });
    expect(surface[2]).toEqual({ names: ['Maybe'], source: '$core/interfaces', typeOnly: true });
  });

  it('parses local declarations as type-only or runtime exports', () => {
    const surface = parseSurface(`
export interface CustomWrapperProps {
  journeyName: string;
}
export type { StyleObject } from '$core/style.store';
`);
    expect(surface[0]).toEqual({
      names: ['CustomWrapperProps'],
      source: null,
      typeOnly: true,
    });
  });

  it('captures a wildcard re-export with no names', () => {
    const surface = parseSurface(`export * from '$components/primitives';`);
    expect(surface[0]).toEqual({ names: [], source: '$components/primitives', typeOnly: false });
  });
});

describe('checkSurface', () => {
  const runtimeModules = new Set([
    '$core/interfaces',
    '$core/style.store',
    '$components/stacked.svelte',
  ]);

  it('passes a surface that re-exports package and type-only contract modules', () => {
    const violations = checkSurface({
      surface: parseSurface(`
export type { Maybe } from '$core/interfaces';
export { default as Stacked } from '$components/stacked.svelte';
export interface Wrapper { name: string }
`),
      runtimeModules,
    });
    expect(violations).toEqual([]);
  });

  it('fails a wildcard re-export', () => {
    const [violation] = checkSurface({
      surface: parseSurface(`export * from '$components/primitives';`),
      runtimeModules,
    });
    expect(violation?.kind).toBe('wildcard-export');
  });

  it('allows an aliased runtime re-export of a package module', () => {
    const violations = checkSurface({
      surface: parseSurface(`export { default as Stacked } from '$components/stacked.svelte';`),
      runtimeModules,
    });
    expect(violations).toEqual([]);
  });

  it('fails an external re-export outside the journey-client type contract', () => {
    const [violation] = checkSurface({
      surface: parseSurface(`export { styleStore } from 'svelte/store';`),
      runtimeModules,
    });
    expect(violation?.kind).toBe('forbidden-external');
  });

  it('allows the journey-client type contract', () => {
    const violations = checkSurface({
      surface: parseSurface(`export type { JourneyStep } from '@forgerock/journey-client/types';`),
      runtimeModules,
    });
    expect(violations).toEqual([]);
  });

  it('fails a source outside the package runtime surface', () => {
    const [violation] = checkSurface({
      surface: parseSurface(`export type { X } from '$core/constants';`),
      runtimeModules,
    });
    expect(violation?.kind).toBe('source-outside-surface');
  });
});

describe('surfaceViolations (real surface file)', () => {
  it('finds zero violations in experimental/custom/login-framework.ts', () => {
    expect(surfaceViolations(surfaceFile, packageRoot)).toEqual([]);
  });

  it('parses the reviewed export baseline (drift guard against parser misses)', () => {
    const surfaceText = readFileSync(surfaceFile, 'utf8');
    // 59 reviewed export statements in login-framework.ts (2026-11-16):
    // compositions, primitives, icons, T, CallbackMapper, runtime
    // utilities, type re-exports, CustomWrapperProps, storybook helpers.
    // Multi-name statements collapse to one entry each, so the parsed
    // entry count equals the statement count.
    expect(parseSurface(surfaceText).length).toBeGreaterThanOrEqual(59);
  });

  it('flags an export pointing outside the package surface in a drifted file', () => {
    const violations = checkSurface({
      surface: parseSurface(`export type { AppConfig } from '$core/constants';`),
      runtimeModules: collectRuntimeModules(packageRoot),
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('source-outside-surface');
  });

  it('flags an excluded runtime file even when it exists on disk (no resolver fallback)', () => {
    // The real resolver resolves any existing file under the alias roots, so
    // a drifted surface re-exporting `$core/constants` (excluded from the
    // package build but present on disk) must still fail: the runtime module
    // set is the single allowlist, and a source that exists on disk proves
    // nothing about being part of the built surface. `constants.ts` is a
    // real file at the alias, so the "exists on disk" condition is live.
    const violations = checkSurface({
      surface: parseSurface(`export { AppConfig } from '$core/constants';`),
      runtimeModules: collectRuntimeModules(packageRoot),
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.kind).toBe('source-outside-surface');
  });
});
