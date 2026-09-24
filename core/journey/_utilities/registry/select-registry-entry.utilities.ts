/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type { CustomRegistryEntry } from './custom-registry';

/**
 * Resolves a custom component entry from a generated registry Record by the
 * name configured via the `PUBLIC_CUSTOM_*_NAME` environment variables.
 *
 * @param name - The configured component name (undefined when the env var is
 *   unset or empty). Compared against registry keys exactly as written in the
 *   component's `Name:` field.
 * @param registry - The generated registry Record for the component type
 *   (header or footer). Always a `Record`, possibly empty.
 * @param type - The component type, used in error and warning messages.
 * @param envVarName - The environment variable name, used in messages.
 * @returns The matching registry entry, or `undefined` when nothing is
 *   selected. Throws when the configured name does not exist in the registry.
 */
export function selectRegistryEntry(
  name: string | undefined,
  registry: Record<string, CustomRegistryEntry>,
  type: 'header' | 'footer',
  envVarName: string,
): CustomRegistryEntry | undefined {
  if (name === undefined || name.trim() === '') {
    if (Object.keys(registry).length > 0) {
      const availableNames = Object.keys(registry);
      console.warn(
        `[login-framework] ${availableNames.length} custom ${type} component(s) exist but no ${envVarName} is set. ` +
          `Available names: ${availableNames.join(', ')}. Set ${envVarName} to select one.`,
      );
    }
    return undefined;
  }

  const entry = registry[name];
  if (!entry) {
    const available = Object.keys(registry).join(', ') || '(none)';
    throw new Error(
      `[login-framework] ${envVarName} is set to "${name}" but no custom ${type} component with that name exists. ` +
        `Available names: ${available}. ` +
        `The name must exactly match a component's "Name:" @component field.`,
    );
  }
  return entry;
}
