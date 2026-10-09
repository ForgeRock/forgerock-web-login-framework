/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

/**
 * Segments that may not appear in a repository-relative path: traversal (`..`), the
 * current directory (`.`), empty segments, and git internals (any case).
 */
const FORBIDDEN_SEGMENTS = new Set(['..', '.', '']);

/**
 * Determines whether a bundle path is safe to write. Rejects absolute paths, Windows
 * separators, traversal and dot segments, and `.git` segments in any case.
 */
export const isSafeRelativePath = (path: string): boolean => {
  if (path.length === 0 || path.startsWith('/') || path.includes('\u0000')) {
    return false;
  }
  if (path.includes('\\') || /^[a-zA-Z]:/.test(path)) {
    return false;
  }
  return path
    .split('/')
    .every((segment) => !FORBIDDEN_SEGMENTS.has(segment) && segment.toLowerCase() !== '.git');
};
