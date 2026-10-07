/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

/**
 * Determines whether a bundle path is safe to write. Rejects absolute paths, Windows
 * separators, empty segments, traversal and dot segments, and `.git` segments in any case.
 */
export const isSafeRelativePath = (path: string): boolean =>
  typeof path === 'string' &&
  path.length > 0 &&
  !path.startsWith('/') &&
  !path.includes('\u0000') &&
  !path.includes('\\') &&
  !/^[a-zA-Z]:/.test(path) &&
  path
    .split('/')
    .every(
      (segment) =>
        segment !== '..' && segment !== '.' && segment.toLowerCase() !== '.git' && segment !== '',
    );
