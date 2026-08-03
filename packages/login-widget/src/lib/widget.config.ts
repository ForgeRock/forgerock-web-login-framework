/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { z } from 'zod';

import { captchaConfigSchema } from '$core/captcha.config';
import { partialLinksSchema } from '$core/links.store';
import { partialStringsSchema } from '$core/locale.store';
import { oidcClientConfigSchema } from '$core/oidc/oidc.store';
import { partialStyleSchema } from '$core/style.store';
import { journeyConfigSchema } from '$journey/config.store';

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

/**
 * Top-level schema for all configure() options.
 * Snapshot-tested in widget.config.test.ts — any addition or removal of a top-level
 * key will fail that test, forcing an explicit snapshot update and PR review.
 */
export const widgetConfigOptionsSchema = z.object({
  wellknown: wellknownSchema,
  logger: loggerConfigSchema.optional(),
  middleware: middlewareSchema.optional(),
  captcha: captchaConfigSchema.optional(),
  oidcClient: oidcClientConfigSchema.omit({ serverConfig: true }).optional(),
  content: partialStringsSchema.optional(),
  journeys: journeyConfigSchema.optional(),
  links: partialLinksSchema.optional(),
  style: partialStyleSchema.optional(),
});

export type WidgetConfigOptions = z.infer<typeof widgetConfigOptionsSchema>;
