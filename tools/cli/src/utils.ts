/** Converts all backslashes to forward slashes for cross-platform path comparisons. */
export function normalizeSeparators(p: string): string {
  return p.replace(/\\/g, '/');
}
