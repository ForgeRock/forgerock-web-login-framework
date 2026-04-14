/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * This schema may be moved/renamed later
 * Right now, it contains only token-related schema
 **/

import { z } from 'zod';

export const tokenIdSchema = z.string().brand<'TokenId'>();

export type TokenId = z.output<typeof tokenIdSchema>;
