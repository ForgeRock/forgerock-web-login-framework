/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { readFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { openApiSpec } from './openapi';

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const;

const SERVER_ROUTES_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../..', 'routes/api');

/** Turns a routes/api subdirectory into its spec path, e.g. `components/[type]/[id]` → `/api/components/{type}/{id}`. */
const specPathFor = (routeDir: string): string => {
  const segments = relative(SERVER_ROUTES_DIR, routeDir).split('/');
  const dynamic = (segment: string) =>
    segment.startsWith('[') ? `{${segment.slice(1, -1)}}` : segment;
  return `/api/${segments.map(dynamic).join('/')}`;
};

/** Route files the spec documents, relative to `routes/api`: the Component API and its health probe. */
const DOCUMENTED_ROUTES = [
  'components/[type]/+server.ts',
  'components/[type]/[id]/+server.ts',
  'components/publish/+server.ts',
  'health/live/+server.ts',
] as const;

/**
 * Reads each documented route's `+server.ts` and derives the routes that actually exist.
 * Routes outside `DOCUMENTED_ROUTES` (the OAuth endpoints) are deliberately not part
 * of this spec.
 */
const actualRoutes = async (): Promise<Map<string, ReadonlyArray<string>>> => {
  const routes = new Map<string, ReadonlyArray<string>>();

  for (const routeFile of DOCUMENTED_ROUTES) {
    const routeDir = join(SERVER_ROUTES_DIR, dirname(routeFile));
    const source = await readFile(join(SERVER_ROUTES_DIR, routeFile), 'utf8');
    const methods = HTTP_METHODS.filter((method) =>
      source.includes(`export const ${method.toUpperCase()}`),
    );
    routes.set(specPathFor(routeDir), methods);
  }

  return routes;
};

describe('openApiSpec', () => {
  it('documents exactly the Component API and health routes that exist, with the same methods', async () => {
    const actual = await actualRoutes();
    const documented = new Map(
      Object.entries(openApiSpec.paths).map(([path, pathItem]) => [
        path,
        HTTP_METHODS.filter((method) => method in pathItem),
      ]),
    );

    expect([...documented.keys()].sort()).toEqual([...actual.keys()].sort());
    for (const [path, methods] of actual) {
      expect(documented.get(path), `methods for ${path}`).toEqual(methods);
    }
  });

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
      '403',
      '404',
    ]);
    expect(Object.keys(openApiSpec.paths['/api/components/{type}'].post.responses)).toEqual([
      '201',
      '400',
      '401',
      '403',
      '413',
      '415',
      '500',
    ]);
    expect(Object.keys(openApiSpec.paths['/api/components/{type}/{id}'].get.responses)).toEqual([
      '200',
      '401',
      '403',
      '404',
    ]);
    expect(Object.keys(openApiSpec.paths['/api/components/{type}/{id}'].put.responses)).toEqual([
      '200',
      '400',
      '401',
      '403',
      '404',
      '413',
      '415',
      '500',
    ]);
    expect(Object.keys(openApiSpec.paths['/api/components/{type}/{id}'].delete.responses)).toEqual([
      '204',
      '400',
      '401',
      '403',
      '404',
    ]);
    expect(Object.keys(openApiSpec.paths['/api/components/publish'].post.responses)).toEqual([
      '200',
      '400',
      '401',
      '403',
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
