/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * @function logErrorAndThrow - Logs an error message and throws an error.
 * @param {string} type - The type of error. This will be used to determine what error message to log.
 * @throws {Error} - An error with a message that depends on the value of `type`.
 */

export function logErrorAndThrow(type: string) {
  if (type === 'missingStores') {
    const errorMessage = 'Error: missing configuration.';

    console.error(errorMessage);
    console.error(
      'Import `configure` and `await` it before using the journey, user, or protect APIs. Example:\n' +
        "  import { configure } from '@forgerock/login-widget';\n" +
        '  await configure({\n' +
        "    serverConfig: { wellknown: 'https://<tenant>/am/oauth2/<realm>/.well-known/openid-configuration' },\n" +
        "    oidcClient: { clientId: '<client-id>', redirectUri: '<your-app-origin>/callback', scope: 'openid profile email' },\n" +
        '  });',
    );

    throw new Error(errorMessage);
  }
}
