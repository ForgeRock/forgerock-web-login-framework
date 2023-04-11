import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
  return {
    package: {
      name: 'Login Widget',
      version: 'Beta',
    },
    app: {
      name: 'Login App',
      version: 'Alpha',
    },
    framework: {
      name: 'Web Login Framework',
      version: 'Alpha',
    },
  };
};
