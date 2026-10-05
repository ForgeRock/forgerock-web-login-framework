/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { describe, expect, it } from 'vitest';

import {
  ComponentIdSchema,
  ComponentTypeSchema,
  CreateComponentRequestSchema,
  projectRecord,
  PublishRequestSchema,
} from './fields.utils';

const componentId = '550e8400-e29b-41d4-a716-446655440000';
const meta = {
  name: 'password',
  displayName: 'Password',
  publish: true,
  fromComponent: '',
  fromJson: '',
};

const decodes = <S extends { safeParse: (input: unknown) => { success: boolean } }>(
  schema: S,
  input: unknown,
) => schema.safeParse(input).success;

describe('Component API schemas', () => {
  it('accepts supported component types and rejects unknown types', () => {
    expect(decodes(ComponentTypeSchema, 'callbacks')).toBe(true);
    expect(decodes(ComponentTypeSchema, 'widgets')).toBe(false);
  });

  it('accepts UUID component ids and rejects invalid ids', () => {
    expect(decodes(ComponentIdSchema, componentId)).toBe(true);
    expect(decodes(ComponentIdSchema, 'component-1')).toBe(false);
  });

  it('rejects server-owned ids and dates from create requests', () => {
    expect(
      decodes(CreateComponentRequestSchema, {
        src: '',
        meta: { ...meta, createdDate: 'x' },
      }),
    ).toBe(false);
    expect(decodes(CreateComponentRequestSchema, { id: componentId, src: '', meta })).toBe(false);
  });

  it('accepts publish requests with and without files', () => {
    expect(decodes(PublishRequestSchema, { code: 'export default {}' })).toBe(true);
    expect(
      decodes(PublishRequestSchema, {
        code: 'export default {}',
        files: [{ path: 'component.svelte', content: '<div />' }],
      }),
    ).toBe(true);
  });

  it('projects only requested nested fields', () => {
    expect(
      projectRecord({ callback: { id: 'id', meta: { name: 'Password' } }, src: 'ignored' }, [
        ['callback', 'meta', 'name'],
      ]),
    ).toEqual({ callback: { meta: { name: 'Password' } } });
  });
});
