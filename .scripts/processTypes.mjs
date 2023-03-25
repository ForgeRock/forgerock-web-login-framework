import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/*
 * This file is to postprocess the types that are generated by svelte
 * at this time svelte-kit package is really only for building
 * svelte component libraries and we want to do our best to
 * remove svelte related namespaces from the types.
 * Furthermore, there is no good way to generate d.ts files without svelte-package
 * so we are leveraging it to build out d.ts files for the widget
 * but then trying to remove svelte related declarations like this.
 */

const declareModuleSection = `declare module '*.svelte' {
    export { SvelteComponentDev as default } from 'svelte/internal';
}
`;
const importMetaPath = fileURLToPath(import.meta.url);
const importMetaDirectoryPath = dirname(importMetaPath);
const index = join(importMetaDirectoryPath, '../', 'package', 'index.d.ts');

const indexContents = String(readFileSync(index));

const declareModuleIdx = indexContents.indexOf(declareModuleSection);
if (declareModuleIdx === -1) {
  console.error(`Failed to remove the Svelte declare module section from ${inline}`);
  process.exit(1);
}

const indexCleaned = indexContents.replace(declareModuleSection, '');

writeFileSync(index, indexCleaned);