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
