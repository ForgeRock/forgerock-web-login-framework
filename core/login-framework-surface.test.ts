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
      unsupported: false,
    });
    expect(surface[1]).toEqual({
      names: ['interpolate', 'textToKey'],
      source: '$core/_utilities/i18n.utilities',
      typeOnly: false,
      unsupported: false,
    });
    expect(surface[2]).toEqual({
      names: ['Maybe'],
      source: '$core/interfaces',
      typeOnly: true,
      unsupported: false,
    });
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
      unsupported: false,
    });
  });

  it('captures a wildcard re-export with no names', () => {
    const surface = parseSurface(`export * from '$components/primitives';`);
    expect(surface[0]).toEqual({
      names: [],
      source: '$components/primitives',
      typeOnly: false,
      unsupported: false,
    });
  });

  it('resolves a locally exported import binding to its import source', () => {
    const surface = parseSurface(`
import { styleStore } from 'svelte/store';
export { styleStore };
`);
    expect(surface).toEqual([
      { names: ['styleStore'], source: 'svelte/store', typeOnly: false, unsupported: false },
    ]);
  });

  it('resolves default, namespace and renamed import bindings', () => {
    const surface = parseSurface(`
import Stacked from '$components/stacked.svelte';
import * as stores from 'svelte/store';
import { writable as makeWritable } from 'svelte/store';
export { Stacked, stores, makeWritable as create };
`);
    expect(surface).toEqual([
      {
        names: ['Stacked'],
        source: '$components/stacked.svelte',
        typeOnly: false,
        unsupported: false,
      },
      { names: ['stores'], source: 'svelte/store', typeOnly: false, unsupported: false },
      { names: ['create'], source: 'svelte/store', typeOnly: false, unsupported: false },
    ]);
  });

  it('keeps a type-only import binding type-only when exported locally', () => {
    const surface = parseSurface(`
import type { JourneyStep } from '@forgerock/journey-client/types';
import { type Maybe } from '$core/interfaces';
export type { JourneyStep };
export { Maybe };
`);
    expect(surface).toEqual([
      {
        names: ['JourneyStep'],
        source: '@forgerock/journey-client/types',
        typeOnly: true,
        unsupported: false,
      },
      { names: ['Maybe'], source: '$core/interfaces', typeOnly: true, unsupported: false },
    ]);
  });

  it('keeps a locally declared name exported without an import as a local export', () => {
    const surface = parseSurface(`
const answer = 42;
export { answer };
`);
    expect(surface).toEqual([
      { names: ['answer'], source: null, typeOnly: false, unsupported: false },
    ]);
  });

  it('ignores export statements inside block and JSDoc comments', () => {
    const surface = parseSurface(`
/**
 * Example:
 * export { AppConfig } from '$core/constants';
 */
/* export * from '$core/constants'; */
export type { Maybe } from '$core/interfaces'; // export { x } from 'y';
`);
    expect(surface).toEqual([
      { names: ['Maybe'], source: '$core/interfaces', typeOnly: true, unsupported: false },
    ]);
  });

  it('keeps code after a line comment that mentions a block comment opener', () => {
    const surface = parseSurface(`
// see /* the docs
export type { Maybe } from '$core/interfaces';
`);
    expect(surface).toEqual([
      { names: ['Maybe'], source: '$core/interfaces', typeOnly: true, unsupported: false },
    ]);
  });

  it('parses an inline `export { type X } from` modifier in the first position', () => {
    const surface = parseSurface(`export { type Maybe } from '$core/interfaces';`);
    expect(surface).toEqual([
      { names: ['Maybe'], source: '$core/interfaces', typeOnly: true, unsupported: false },
    ]);
  });

  it('parses an inline type modifier with a rename', () => {
    const surface = parseSurface(`export { type Maybe as Possibly } from '$core/interfaces';`);
    expect(surface).toEqual([
      { names: ['Possibly'], source: '$core/interfaces', typeOnly: true, unsupported: false },
    ]);
  });
});

describe('parseSurface (unparsed statement forms fail closed)', () => {
  it.each([
    ['export const', `export const styleStore = getStore();`],
    ['export function', `export function initializeStyles() {}`],
    ['export class', `export class Widget {}`],
    ['export let', `export let count = 1;`],
    ['export default', `export default {};`],
  ])('flags a %s declaration instead of staying invisible', (label, sourceText) => {
    const surface = parseSurface(sourceText);
    // A declaration form the reviewed surface never uses must not parse as
    // an invisible no-op. It parses as an explicit, unresolvable export
    // (source null on a runtime declaration, or absent-but-counted), so the
    // baseline count and the check both react to its appearance.
    expect(surface.length, `${label} must produce one parsed entry`).toBe(1);
    expect(surface[0]?.names).toEqual([]);
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

  it('fails an imported external binding re-exported without a from clause', () => {
    const [violation] = checkSurface({
      surface: parseSurface(`
import { styleStore } from 'svelte/store';
export { styleStore };
`),
      runtimeModules,
    });
    expect(violation).toEqual({
      kind: 'forbidden-external',
      names: ['styleStore'],
      source: 'svelte/store',
    });
  });

  it('fails an imported binding from an excluded package module re-exported locally', () => {
    const [violation] = checkSurface({
      surface: parseSurface(`
import { AppConfig } from '$core/constants';
export { AppConfig };
`),
      runtimeModules,
    });
    expect(violation?.kind).toBe('source-outside-surface');
  });

  it('allows a type-only journey-client import re-exported locally', () => {
    const violations = checkSurface({
      surface: parseSurface(`
import type { JourneyStep } from '@forgerock/journey-client/types';
export type { JourneyStep };
`),
      runtimeModules,
    });
    expect(violations).toEqual([]);
  });

  it('judges a $locales re-export by the allowlist, not as an external package', () => {
    const [violation] = checkSurface({
      surface: parseSurface(`export { messages } from '$locales/us/en';`),
      runtimeModules,
    });
    expect(violation?.kind).toBe('source-outside-surface');
  });

  it('matches a $locales re-export against the runtime allowlist via its locales mapping', () => {
    // The collector maps `locales/...` sources to `$core/locales/...`, so a
    // `$locales/...` re-export must be normalised to that mapped specifier
    // before the allowlist lookup; a bare `$locales/...` key would never
    // match and the `$locales` alias root would be dead (always fails as
    // source-outside-surface). The alias form must behave exactly like its
    // mapped `$core/locales` twin.
    const viaAlias = checkSurface({
      surface: parseSurface(`export { messages } from '$locales/us/en';`),
      runtimeModules: new Set(['$core/locales/us/en']),
    });
    const viaMapped = checkSurface({
      surface: parseSurface(`export { messages } from '$core/locales/us/en';`),
      runtimeModules: new Set(['$core/locales/us/en']),
    });
    expect(viaAlias).toEqual([]);
    expect(viaMapped).toEqual([]);
  });

  it('does not report an export that only appears inside a block comment', () => {
    const violations = checkSurface({
      surface: parseSurface(`
/**
 * export { AppConfig } from '$core/constants';
 */
export type { Maybe } from '$core/interfaces';
`),
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
    // Multi-name `from` statements collapse to one entry each, so the parsed
    // entry count equals the statement count. Exact, so a statement the
    // parser misses (or an unreviewed addition) fails here.
    expect(parseSurface(surfaceText)).toHaveLength(59);
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
