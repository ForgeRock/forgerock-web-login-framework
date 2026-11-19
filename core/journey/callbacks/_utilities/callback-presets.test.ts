/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

import {
  callbackPresets,
  checkCallbackPresets,
  mapperCallbackTypes,
  RENDERABLE_CALLBACK_TYPES,
} from './callback-presets';

const packageRoot = resolve(import.meta.dirname, '../../..');

const mapperSource = readFileSync(
  resolve(packageRoot, 'journey/_utilities/callback-mapper.svelte'),
  'utf8',
);
const enumTypes = Object.values(callbackType);

describe('RENDERABLE_CALLBACK_TYPES', () => {
  it('contains every callback type the mapper switches on (one to one)', () => {
    const mapperTypes = mapperCallbackTypes(mapperSource);
    expect(mapperTypes.length).toBeGreaterThan(0);
    expect([...RENDERABLE_CALLBACK_TYPES].sort()).toEqual([...mapperTypes].sort());
  });

  it('only lists types that exist in the journey-client callbackType enum', () => {
    const unknownTypes = RENDERABLE_CALLBACK_TYPES.filter((type) => !enumTypes.includes(type));
    expect(unknownTypes).toEqual([]);
  });
});

describe('callbackPresets', () => {
  it('has a preset for every renderable callback type', () => {
    expect(Object.keys(callbackPresets).sort()).toEqual([...RENDERABLE_CALLBACK_TYPES].sort());
  });

  it('every preset payload has the matching callback type', () => {
    for (const [type, preset] of Object.entries(callbackPresets)) {
      expect(preset.callbacks[0]?.type, `preset for ${type}`).toBe(type);
    }
  });

  it('every preset payload carries its output entries (input when the type has one)', () => {
    for (const [type, preset] of Object.entries(callbackPresets)) {
      expect(preset.callbacks[0]?.output, `output for ${type}`).toBeTruthy();
    }
    // MetadataCallback is a read-only AM callback: no input entries exist.
    expect(callbackPresets.MetadataCallback?.callbacks[0]?.input).toBeUndefined();
  });
});

describe('checkCallbackPresets against the real catalog', () => {
  it('reports no violations for the real presets, enum and mapper source', () => {
    expect(
      checkCallbackPresets({
        enumTypes,
        mapperCases: mapperCallbackTypes(mapperSource),
        presets: callbackPresets,
      }),
    ).toEqual([]);
  });

  it('reports the missing preset when one is deleted from a clone of the real catalog', () => {
    const catalogWithoutName = Object.fromEntries(
      Object.entries(callbackPresets).filter(([type]) => type !== 'NameCallback'),
    );
    expect(
      checkCallbackPresets({
        enumTypes,
        mapperCases: mapperCallbackTypes(mapperSource),
        presets: catalogWithoutName,
      }),
    ).toEqual([
      {
        kind: 'missing-preset',
        detail: 'NameCallback is rendered by the mapper but has no preset payload',
      },
    ]);
  });
});

describe('checkCallbackPresets', () => {
  const syntheticEnumTypes = [
    'NameCallback',
    'PasswordCallback',
    'NumberAttributeInputCallback',
    'RedirectCallback',
  ];
  const mapperCases = ['NameCallback', 'PasswordCallback'];

  it('passes when renderable types, presets and mapper cases align', () => {
    const violations = checkCallbackPresets({
      enumTypes: syntheticEnumTypes,
      mapperCases,
      presets: {
        NameCallback: { type: 'NameCallback', callbacks: [] },
        PasswordCallback: { type: 'PasswordCallback', callbacks: [] },
      },
    });
    expect(violations).toEqual([]);
  });

  it('fails a mapper case with no preset (newly added callback type)', () => {
    const violations = checkCallbackPresets({
      enumTypes: syntheticEnumTypes,
      mapperCases: [...mapperCases, 'RedirectCallback'],
      presets: {
        NameCallback: { type: 'NameCallback', callbacks: [] },
        PasswordCallback: { type: 'PasswordCallback', callbacks: [] },
      },
    });
    expect(violations).toEqual([
      {
        kind: 'missing-preset',
        detail: 'RedirectCallback is rendered by the mapper but has no preset payload',
      },
    ]);
  });

  it('fails a preset whose type the mapper never renders', () => {
    const violations = checkCallbackPresets({
      enumTypes: syntheticEnumTypes,
      mapperCases,
      presets: {
        NameCallback: { type: 'NameCallback', callbacks: [] },
        PasswordCallback: { type: 'PasswordCallback', callbacks: [] },
        RedirectCallback: { type: 'RedirectCallback', callbacks: [] },
      },
    });
    expect(violations).toContainEqual({
      kind: 'preset-not-renderable',
      detail: 'RedirectCallback has a preset but the mapper never renders it',
    });
  });

  it('flags a mapper case that is not a known enum type', () => {
    const violations = checkCallbackPresets({
      enumTypes: syntheticEnumTypes,
      mapperCases: [...mapperCases, 'ConsentMappingCallback'],
      presets: {
        NameCallback: { type: 'NameCallback', callbacks: [] },
        PasswordCallback: { type: 'PasswordCallback', callbacks: [] },
      },
    });
    expect(violations).toContainEqual({
      kind: 'unknown-mapper-type',
      detail:
        'ConsentMappingCallback is rendered by the mapper but is not a journey-client callback type',
    });
  });

  it('does not flag a non-renderable enum type without a preset', () => {
    const violations = checkCallbackPresets({
      enumTypes: syntheticEnumTypes,
      mapperCases,
      presets: {
        NameCallback: { type: 'NameCallback', callbacks: [] },
        PasswordCallback: { type: 'PasswordCallback', callbacks: [] },
      },
    });
    expect(violations).toEqual([]);
  });
});
