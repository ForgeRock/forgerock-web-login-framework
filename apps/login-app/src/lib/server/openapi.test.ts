/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { describe, expect, it } from 'vitest';

import { openApiSpec } from './openapi';

describe('openApiSpec', () => {
  it('documents component bundle publication', () => {
    const requestSchema =
      openApiSpec.paths['/api/save'].post.requestBody.content['application/json'].schema;

    expect(openApiSpec.openapi).toMatch(/^3\.1\./);
    expect(openApiSpec.paths['/api/save'].post).toBeDefined();
    expect(requestSchema).toMatchObject({
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            required: ['path', 'content'],
          },
        },
      },
    });
  });
});
