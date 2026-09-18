/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import { dev } from '$app/environment';
import { openApiSpec } from '$lib/server/openapi';

/**
 * Serves the development-only OpenAPI document.
 */
export const GET = () => {
  if (!dev) {
    return new Response('Not Found', { status: 404 });
  }

  return Response.json(openApiSpec);
};
