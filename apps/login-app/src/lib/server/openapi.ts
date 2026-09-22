/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import * as OpenApiJsonSchema from '@effect/platform/OpenApiJsonSchema';

import {
  ApiErrorBodySchema,
  ComponentRecordSchema,
  CreateComponentRequestSchema,
  PublishRequestSchema,
  PublishResponseSchema,
  UpdateComponentRequestSchema,
} from './component-api';

/** OpenAPI JSON Schema for persisted component records. */
const componentRecordSchema = OpenApiJsonSchema.makeWithDefs(ComponentRecordSchema, { defs: {} });
/** OpenAPI JSON Schema for component-creation requests. */
const createComponentRequestSchema = OpenApiJsonSchema.makeWithDefs(CreateComponentRequestSchema, {
  defs: {},
});
/** OpenAPI JSON Schema for component-update requests. */
const updateComponentRequestSchema = OpenApiJsonSchema.makeWithDefs(UpdateComponentRequestSchema, {
  defs: {},
});
/** OpenAPI JSON Schema for component-publication requests. */
const publishRequestSchema = OpenApiJsonSchema.makeWithDefs(PublishRequestSchema, { defs: {} });
/** OpenAPI JSON Schema for successful component-publication responses. */
const publishResponseSchema = OpenApiJsonSchema.makeWithDefs(PublishResponseSchema, { defs: {} });
/** OpenAPI JSON Schema for standardized API error bodies. */
const errorSchema = OpenApiJsonSchema.makeWithDefs(ApiErrorBodySchema, { defs: {} });

/** Creates an OpenAPI JSON response definition with a description and body schema. */
const jsonResponse = (description: string, schema: object) => ({
  description,
  content: { 'application/json': { schema } },
});

/** Creates an OpenAPI error response definition using the shared API error schema. */
const errorResponse = (description: string) => jsonResponse(description, errorSchema);

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
    description: 'Development-only API for managing and publishing custom components.',
  },
  tags: [
    {
      name: 'Components',
      description: 'Manage custom UI component bundles.',
    },
    {
      name: 'Health',
      description: 'Application liveness probe.',
    },
  ],
  paths: {
    '/api/health/live': {
      get: {
        tags: ['Health'],
        summary: 'Check application liveness',
        responses: {
          '200': jsonResponse('The application is live.', {
            type: 'object',
            required: ['status'],
            properties: { status: { const: 'ok' } },
            additionalProperties: false,
          }),
        },
      },
    },
    '/api/components/{type}': {
      get: {
        tags: ['Components'],
        summary: 'List component records',
        parameters: [
          { name: 'type', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'fields', in: 'query', required: false, schema: { type: 'string' } },
        ],
        responses: {
          '200': jsonResponse('Component records.', {
            type: 'array',
            items: componentRecordSchema,
          }),
          '400': errorResponse('The fields projection is invalid.'),
          '401': errorResponse('The request is not authorized.'),
          '404': errorResponse('The component type is invalid.'),
        },
      },
      post: {
        tags: ['Components'],
        summary: 'Create a component record',
        parameters: [{ name: 'type', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: createComponentRequestSchema } },
        },
        responses: {
          '201': jsonResponse('The created component record.', componentRecordSchema),
          '400': errorResponse('The request is invalid.'),
          '401': errorResponse('The request is not authorized.'),
          '413': errorResponse('The request body exceeds the accepted size limit.'),
          '415': errorResponse('The request content type must be application/json.'),
          '500': errorResponse('The component could not be persisted.'),
        },
      },
    },
    '/api/components/{type}/{id}': {
      get: {
        tags: ['Components'],
        summary: 'Retrieve a component record',
        parameters: [
          { name: 'type', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': jsonResponse('The component record.', componentRecordSchema),
          '404': errorResponse('The component record was not found.'),
        },
      },
      put: {
        tags: ['Components'],
        summary: 'Update a component record',
        parameters: [
          { name: 'type', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: updateComponentRequestSchema } },
        },
        responses: {
          '200': jsonResponse('The updated component record.', componentRecordSchema),
          '400': errorResponse('The request is invalid.'),
          '401': errorResponse('The request is not authorized.'),
          '404': errorResponse('The component record was not found.'),
          '413': errorResponse('The request body exceeds the accepted size limit.'),
          '415': errorResponse('The request content type must be application/json.'),
          '500': errorResponse('The component could not be persisted.'),
        },
      },
      delete: {
        tags: ['Components'],
        summary: 'Delete a component record',
        parameters: [
          { name: 'type', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '204': { description: 'The component record was deleted.' },
          '400': errorResponse('The request is invalid.'),
          '401': errorResponse('The request is not authorized.'),
          '404': errorResponse('The component record was not found.'),
        },
      },
    },
    '/api/components/publish': {
      post: {
        tags: ['Components'],
        summary: 'Publish component source code',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: publishRequestSchema } },
        },
        responses: {
          '200': jsonResponse('The published component bundle.', publishResponseSchema),
          '400': errorResponse('The request is invalid.'),
          '401': errorResponse('The request is not authorized.'),
          '413': errorResponse('The request body exceeds the accepted size limit.'),
          '415': errorResponse('The request content type must be application/json.'),
          '500': errorResponse('The component source could not be published.'),
        },
      },
    },
  },
} as const;
