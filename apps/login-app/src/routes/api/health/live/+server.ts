/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { json } from '@sveltejs/kit';

/**
 * Serves the liveness status consumed by load balancer health checks.
 *
 * @category routes
 */
export const GET = () => json({ status: 'ok' });
