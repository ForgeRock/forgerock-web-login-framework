/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { z } from 'zod';

import type { CustomLogger, GenericError, RequestMiddleware } from '@forgerock/oidc-client/types';

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

/**
 * Suppresses rendering of script-type text output; `TextOutputCallback` with `messageType` 4.
 * The widget never executes these scripts, so printing them shows raw source to the user.
 */
export const hideScriptedTextOutputSchema = z.boolean().default(false);

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
    custom: z.object({
      get: z.custom<(key: string) => Promise<string | null | GenericError>>(
        (val) => typeof val === 'function',
      ),
      set: z.custom<(key: string, value: string) => Promise<void | GenericError>>(
        (val) => typeof val === 'function',
      ),
      remove: z.custom<(key: string) => Promise<void | GenericError>>(
        (val) => typeof val === 'function',
      ),
    }),
  }),
]);
