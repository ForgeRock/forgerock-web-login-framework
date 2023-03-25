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
      'Please configure Widget by importing `configuration` and calling `set` with your settings.',
    );

    throw new Error(errorMessage);
  } else if (type === 'missingBaseUrl') {
    const errorMessage = 'Error: missing `serverConfig.baseUrl`.';

    console.error(errorMessage);
    console.error(
      'Please configure Widget by importing `configuration` and calling `set` with your ForgeRock server URL.',
    );

    throw new Error(errorMessage);
  }
}
