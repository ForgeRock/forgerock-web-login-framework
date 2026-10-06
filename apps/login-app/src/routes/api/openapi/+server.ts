/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { isComponentApiEnabled } from '$lib/server/custom-components/api';
import { openApiSpec } from '$lib/server/custom-components/openapi';

/**
 * Serves the OpenAPI document wherever the Component API is enabled.
 *
 * @returns The OpenAPI specification with 200 when the Component API is enabled, or 404 otherwise.
 */
export const GET = () => {
  if (!isComponentApiEnabled()) {
    return new Response('Not Found', { status: 404 });
  }

  return Response.json(openApiSpec);
};
