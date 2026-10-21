/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

// Credentials stay out of the repo for security; they come from CI secrets.
// These tests do not run in normal local development.
const username = process.env.FR_AM_ADMIN_USERNAME;
const password = process.env.FR_AM_ADMIN_PASSWORD;

export { username, password };
export const displayName = 'E2E Admin';
