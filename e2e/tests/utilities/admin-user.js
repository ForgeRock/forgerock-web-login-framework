/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

// Credentials stay out of the repo for security; they come from the
// environment (.env / CI secrets) instead.
const username = process.env.FR_AM_ADMIN_USERNAME;
const password = process.env.FR_AM_ADMIN_PASSWORD;

if (!username || !password) {
  throw new Error(
    'FR_AM_ADMIN_USERNAME and FR_AM_ADMIN_PASSWORD must be set for the Component API e2e tests (root .env locally, repo secrets in CI)',
  );
}

export { username, password };
export const displayName = 'E2E Admin';
