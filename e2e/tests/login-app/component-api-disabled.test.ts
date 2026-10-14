/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { expect, test } from '@playwright/test';

/**
 * Runs against the `config-error` project's preview server (port 3100), which sets
 * COMPONENT_API_ENABLED=false. A disabled deployment 404s the spec, and the docs page
 * must degrade to its explanatory message, not a Swagger error.
 */
test('api-docs shows the unavailable message when the API is disabled', async ({ page }) => {
  await page.goto('/api-docs');

  await expect(
    page.getByText('OpenAPI spec is only available while the Component API is enabled.'),
  ).toBeVisible();
  await expect(page.locator('#swagger-ui')).toHaveCount(0);
});
