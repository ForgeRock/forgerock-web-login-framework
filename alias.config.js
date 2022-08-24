import path from 'path';

export default {
  /**
   * Reminder to ensure aliases are added to the following:
   * 1. .storybook/main.js.
   * 2. tsconfig.json
   */
  $components: path.resolve('./src/lib/components'),
  $journey: path.resolve('./src/lib/journey'),
  $lib: path.resolve('./src/lib'),
  $locales: path.resolve('./src/locales'),
  $package: path.resolve('./package'),
  $widget: path.resolve('./src/widget'),
};
