/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { Context } from 'effect';

import type { CustomLogger } from '@forgerock/sdk-logger';

/** The component API logger surface; the full logger effects module supplies it. */
export type ComponentLogger = Pick<CustomLogger, 'error' | 'warn' | 'info'>;

/** Service tag for the component API logger; layers provide implementations. */
export const Log = Context.GenericTag<ComponentLogger>('Log');
