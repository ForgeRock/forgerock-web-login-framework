/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import * as OpenApiJsonSchema from '@effect/platform/OpenApiJsonSchema';

import { BundleSchema } from './component-publisher';

const bundleSchema = OpenApiJsonSchema.makeWithDefs(BundleSchema, { defs: {} });

const errorSchema = {
  type: 'object',
  required: ['error'],
  properties: {
    error: { type: 'string' },
  },
  additionalProperties: false,
};

/**
 * OpenAPI 3.1 specification for the login-app development endpoints.
 *
 * This document is intentionally exposed only while the SvelteKit app runs in development mode.
 */
export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Login App Development API',
    version: '1.0.0',
    description: 'Development-only API for publishing custom component bundles.',
  },
  paths: {
    '/api/save': {
      post: {
        summary: 'Publish a component bundle',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: bundleSchema,
            },
          },
        },
        responses: {
          '204': {
            description: 'Component bundle persisted successfully.',
          },
          '400': {
            description: 'The component bundle is invalid.',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '500': {
            description: 'The component bundle could not be persisted.',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
  },
} as const;
