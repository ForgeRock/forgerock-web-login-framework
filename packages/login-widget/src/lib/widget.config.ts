/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { z } from 'zod';

import type { CustomLogger, RequestMiddleware, StorageConfig } from '@forgerock/oidc-client/types';

/**
 * Runtime validation for the widget's top-level options; `serverConfig`, `logger`, `middleware`
 * All three reach both the journey and OIDC clients
 */

export const serverConfigSchema = z
  .object({
    wellknown: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? 'serverConfig.wellknown is required to configure the widget'
            : 'serverConfig.wellknown must be a URL string',
      })
      .url({ message: 'serverConfig.wellknown must be a full URL' }),
  })
  .strict();

export const loggerConfigSchema = z
  .object({
    level: z.union([
      z.literal('none'),
      z.literal('error'),
      z.literal('warn'),
      z.literal('info'),
      z.literal('debug'),
    ]),
    custom: z
      .custom<CustomLogger>((value) => typeof value === 'object' && value !== null)
      .optional(),
  })
  .strict();

export const middlewareSchema = z.array(
  z.custom<RequestMiddleware>((value) => typeof value === 'function'),
);

export const storageConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.union([z.literal('localStorage'), z.literal('sessionStorage')]),
    name: z.string(),
    prefix: z.string().optional(),
  }),
  z.object({
    type: z.literal('custom'),
    name: z.string(),
    prefix: z.string().optional(),
    // TODO: use CustomStorageObject directly once it's exported from @forgerock/oidc-client/types
    // https://github.com/ForgeRock/ping-javascript-sdk/blob/%40forgerock/oidc-client%402.1.0/packages/oidc-client/src/types.ts#L21
    custom: z.custom<Extract<StorageConfig, { type: 'custom' }>['custom']>(
      (value) => typeof value === 'object' && value !== null,
    ),
  }),
]);
