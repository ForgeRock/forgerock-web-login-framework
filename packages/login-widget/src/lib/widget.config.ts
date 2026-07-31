/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { z } from 'zod';

import type { CustomLogger, RequestMiddleware } from '@forgerock/oidc-client/types';

/**
 * Runtime validation for the widget's top-level options; `wellknown`, `logger`, `middleware`
 * All three reach both the journey and OIDC clients
 */

export const wellknownSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? 'wellknown url is required to configure the widget'
        : 'wellknown must be a URL string',
  })
  .url({ message: 'wellknown must be a full URL' });

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
