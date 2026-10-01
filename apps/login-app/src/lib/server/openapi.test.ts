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
  it('documents all Component API endpoint response unions', () => {
    const componentPaths = [
      openApiSpec.paths['/api/components/{type}'],
      openApiSpec.paths['/api/components/{type}/{id}'],
      openApiSpec.paths['/api/components/publish'],
    ];

    expect(componentPaths).toHaveLength(3);
    expect(Object.keys(openApiSpec.paths['/api/components/{type}'].get.responses)).toEqual([
      '200',
      '400',
      '401',
      '404',
    ]);
    expect(Object.keys(openApiSpec.paths['/api/components/{type}'].post.responses)).toEqual([
      '201',
      '400',
      '401',
      '413',
      '415',
      '500',
    ]);
    expect(Object.keys(openApiSpec.paths['/api/components/{type}/{id}'].get.responses)).toEqual([
      '200',
      '404',
    ]);
    expect(Object.keys(openApiSpec.paths['/api/components/{type}/{id}'].put.responses)).toEqual([
      '200',
      '400',
      '401',
      '404',
      '413',
      '415',
      '500',
    ]);
    expect(Object.keys(openApiSpec.paths['/api/components/{type}/{id}'].delete.responses)).toEqual([
      '204',
      '400',
      '401',
      '404',
    ]);
    expect(Object.keys(openApiSpec.paths['/api/components/publish'].post.responses)).toEqual([
      '200',
      '400',
      '401',
      '413',
      '415',
      '500',
    ]);
  });

  it('uses component schemas for publish requests and responses', () => {
    const publish = openApiSpec.paths['/api/components/publish'].post;

    expect(publish.requestBody.content['application/json'].schema).toBeDefined();
    expect(publish.responses['200'].content['application/json'].schema).toBeDefined();
  });
});
