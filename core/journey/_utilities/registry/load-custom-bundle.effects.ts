/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * **/

import { z } from 'zod';

import { setRuntimeRegistries } from './runtime-registry.store';

import type { CustomComponentBundle, CustomRegistryEntry } from './registry.interfaces';

/**
 * Validation for the export shape of a runtime Custom Component bundle.
 * `acceptedProps` is required on every entry: the mapper filters props through
 * it, and a missing list would forward nothing (silently blank component).
 * Reserved object-literal keys are rejected for the same reason the compile-time
 * generator rejects them — as a literal key, `__proto__` sets the prototype
 * instead of defining an own property, so the entry would be lost.
 */
const registryEntrySchema = z.object({
  component: z.custom<CustomRegistryEntry['component']>((value) => typeof value === 'function'),
  acceptedProps: z.array(z.string()),
});

const bundleSchema = z
  .object({
    stages: z.record(z.string(), registryEntrySchema).optional(),
    callbacks: z.record(z.string(), registryEntrySchema).optional(),
    header: registryEntrySchema.optional(),
    footer: registryEntrySchema.optional(),
  })
  .refine(
    (bundle) => Boolean(bundle.stages || bundle.callbacks || bundle.header || bundle.footer),
    {
      message: 'Bundle must export at least one of "stages", "callbacks", "header", or "footer"',
    },
  );

const reservedKeys = ['__proto__', 'constructor'];

/**
 * Checks reserved keys on the RAW bundle, not the parsed output: Zod's record
 * parsing silently drops a `__proto__` key when constructing its result, so a
 * check there would never fire — and a loud authoring error is wanted, not a
 * silent drop.
 */
const assertNoReservedKeys = (bundle: CustomComponentBundle) => {
  for (const registryName of ['stages', 'callbacks'] as const) {
    const entries = bundle[registryName] ?? {};
    const reserved = Object.keys(entries).filter((key) => reservedKeys.includes(key));
    if (reserved.length > 0) {
      throw new Error(
        `Custom Component bundle "${registryName}" contains reserved registry key(s): ${reserved.join(
          ', ',
        )}`,
      );
    }
  }
};

/** A module with the expected bundle export shape; the injected import returns this. */
type BundleModule = CustomComponentBundle;

/**
 * @function loadCustomBundle - Fetches and registers a runtime Custom Component bundle
 * @param {string} url - Absolute or app-relative URL of the bundle's ES module
 * @param {object} deps - Injectable dependencies; defaults fit production
 * @param {function} deps.importModule - Imports the bundle module (default: dynamic `import`)
 * @returns {Promise<CustomComponentBundle>} The validated bundle contents, now registered in the runtime registry
 * @throws {Error} If the module fails to load or its export shape is invalid; the runtime registry is left unchanged
 * @example loadCustomBundle('/custom-components/bundle.js');
 */
export async function loadCustomBundle(
  url: string,
  deps: { importModule: (moduleUrl: string) => Promise<BundleModule> } = {
    importModule: (moduleUrl) => import(/* @vite-ignore */ moduleUrl),
  },
): Promise<CustomComponentBundle> {
  let module: BundleModule;
  try {
    module = await deps.importModule(url);
  } catch (cause) {
    throw new Error(`Failed to load Custom Component bundle from "${url}": ${String(cause)}`);
  }

  assertNoReservedKeys(module);

  const parsed = bundleSchema.safeParse(module);
  if (!parsed.success) {
    throw new Error(
      `Custom Component bundle from "${url}" has an invalid export shape: ${parsed.error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; ')}`,
    );
  }

  setRuntimeRegistries(parsed.data);
  return parsed.data;
}
