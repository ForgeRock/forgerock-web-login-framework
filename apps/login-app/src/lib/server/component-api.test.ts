/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { describe, expect, it } from '@effect/vitest';
import { Effect, Schema } from 'effect';

import {
  ComponentIdSchema,
  ComponentTypeSchema,
  CreateComponentRequestSchema,
  encodeComponentResponse,
  parseFields,
  projectRecord,
  PublishRequestSchema,
} from './component-api';

const componentId = '550e8400-e29b-41d4-a716-446655440000';
const meta = {
  name: 'password',
  displayName: 'Password',
  publish: true,
  fromComponent: '',
  fromJson: '',
};
const record = {
  id: componentId,
  src: '<script></script>',
  meta: {
    ...meta,
    createdDate: '2026-01-01T00:00:00Z',
    modifiedDate: '2026-01-02T00:00:00Z',
  },
};

const decodes = <A>(schema: Schema.Schema<A>, input: unknown) =>
  Schema.decodeUnknown(schema)(input).pipe(Effect.either);

describe('Component API schemas', () => {
  it.effect('accepts supported component types and rejects unknown types', () =>
    Effect.gen(function* () {
      expect(yield* decodes(ComponentTypeSchema, 'callbacks')).toMatchObject({ _tag: 'Right' });
      expect(yield* decodes(ComponentTypeSchema, 'widgets')).toMatchObject({ _tag: 'Left' });
    }),
  );

  it.effect('accepts UUID component ids and rejects invalid ids', () =>
    Effect.gen(function* () {
      expect(yield* decodes(ComponentIdSchema, componentId)).toMatchObject({ _tag: 'Right' });
      expect(yield* decodes(ComponentIdSchema, 'component-1')).toMatchObject({ _tag: 'Left' });
    }),
  );

  it.effect('rejects server-owned ids and dates from create requests', () =>
    Effect.gen(function* () {
      expect(
        yield* decodes(CreateComponentRequestSchema, {
          src: '',
          meta: { ...meta, createdDate: 'x' },
        }),
      ).toMatchObject({ _tag: 'Left' });
      expect(
        yield* decodes(CreateComponentRequestSchema, { id: componentId, src: '', meta }),
      ).toMatchObject({ _tag: 'Left' });
    }),
  );

  it.effect('accepts publish requests with and without files', () =>
    Effect.gen(function* () {
      expect(yield* decodes(PublishRequestSchema, { code: 'export default {}' })).toMatchObject({
        _tag: 'Right',
      });
      expect(
        yield* decodes(PublishRequestSchema, {
          code: 'export default {}',
          files: [{ path: 'component.svelte', content: '<div />' }],
        }),
      ).toMatchObject({ _tag: 'Right' });
    }),
  );

  it('parses valid fields paths and rejects empty segments', () => {
    expect(parseFields('callback.id,callback.meta')).toEqual([
      ['callback', 'id'],
      ['callback', 'meta'],
    ]);
    expect(() => parseFields('callback..id')).toThrow('Invalid fields projection');
  });

  it('projects only requested nested fields', () => {
    expect(
      projectRecord(
        { callback: { id: 'id', meta: { name: 'Password' } }, src: 'ignored' },
        parseFields('callback.meta.name'),
      ),
    ).toEqual({ callback: { meta: { name: 'Password' } } });
  });

  it.effect('encodes 201 and 404 component responses', () =>
    Effect.gen(function* () {
      const created = encodeComponentResponse({ status: 201, body: record });
      const missing = encodeComponentResponse({
        status: 404,
        body: { error: 'Component not found' },
      });

      expect(created.status).toBe(201);
      expect(yield* Effect.tryPromise(() => created.json())).toEqual(record);
      expect(missing.status).toBe(404);
      expect(yield* Effect.tryPromise(() => missing.json())).toEqual({
        error: 'Component not found',
      });
    }),
  );
});
