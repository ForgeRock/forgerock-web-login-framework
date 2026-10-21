/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Schema } from 'effect';
import { describe, expect, it } from 'vitest';

import {
  ComponentTypeSchema,
  CreateComponentRequestSchema,
  PublishRequestSchema,
} from './api/api.schemas';
import { pickFields } from './fields.utilities';

const componentId = '550e8400-e29b-41d4-a716-446655440000';
const meta = {
  name: 'password',
  displayName: 'Password',
  publish: true,
  fromComponent: '',
  fromJson: '',
};

describe('Component API schemas', () => {
  it('accepts supported component types and rejects unknown types', () => {
    expect(Schema.is(ComponentTypeSchema)('callbacks')).toBe(true);
    expect(Schema.is(ComponentTypeSchema)('widgets')).toBe(false);
  });

  it('accepts UUID component ids and rejects invalid ids', () => {
    expect(Schema.is(Schema.UUID)(componentId)).toBe(true);
    expect(Schema.is(Schema.UUID)('component-1')).toBe(false);
  });

  it('rejects server-owned ids and dates from create requests', () => {
    const rejects = (input: unknown) => Schema.is(CreateComponentRequestSchema)(input) === false;
    expect(rejects({ src: '', meta: { ...meta, createdDate: 'x' } })).toBe(true);
    expect(rejects({ id: componentId, src: '', meta })).toBe(true);
    expect(
      Schema.is(CreateComponentRequestSchema)({
        src: '',
        meta: { ...meta, createdDate: undefined },
      }),
    ).toBe(true);
  });

  it('accepts publish requests with only the code field', () => {
    expect(Schema.is(PublishRequestSchema)({ code: 'export default {}' })).toBe(true);
    expect(Schema.is(PublishRequestSchema)({})).toBe(false);
  });

  it('projects only requested nested fields', () => {
    expect(
      pickFields({ callback: { id: 'id', meta: { name: 'Password' } }, src: 'ignored' }, [
        ['callback', 'meta', 'name'],
      ]),
    ).toEqual({ callback: { meta: { name: 'Password' } } });
  });

  it('skips a route through a primitive while keeping the other routes', () => {
    expect(pickFields({ id: 'id', json: 5 }, [['json', 'preview'], ['id']])).toEqual({ id: 'id' });
  });

  it('skips routes missing from the record without failing the projection', () => {
    expect(pickFields({ id: 'id' }, [['missing', 'deep'], ['id']])).toEqual({ id: 'id' });
  });

  it('drops unsafe routes and empty routes', () => {
    expect(
      pickFields({ id: 'id', meta: { name: 'x' } }, [
        ['__proto__', 'polluted'],
        [],
        ['meta', 'name'],
      ]),
    ).toEqual({ meta: { name: 'x' } });
  });
});
