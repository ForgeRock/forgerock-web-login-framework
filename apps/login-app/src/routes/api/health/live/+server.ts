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
 * Returns a successful liveness status for load balancer health checks.
 *
 * @returns A JSON response whose status is `ok`.
 */
export const GET = () => json({ status: 'ok' });
