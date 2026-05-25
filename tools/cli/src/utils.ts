/** Converts all backslashes to forward slashes for cross-platform path comparisons. */
export function normalizeSeparators(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Converts an arbitrary string to PascalCase, safe for use as a TypeScript identifier.
 * Handles kebab-case, spaces, and preserves existing word boundaries in PascalCase input.
 * Examples: "my-login-stage" → "MyLoginStage", "My Login Stage" → "MyLoginStage", "DefaultLogin" → "DefaultLogin"
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr: string) => chr.toUpperCase())
    .replace(/^(.)/, (_, chr: string) => chr.toUpperCase());
}
