/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * Journey persistence effects (IAM-12006).
 *
 * Remembers the last started journey so a later bare-suspendedId page load (suspend
 * email link) can restart into the right tree. localStorage (not sessionStorage): the
 * email link opens a new tab/context, and sessionStorage is tab-scoped. All access is
 * guarded — SSR and blocked-storage environments must not crash.
 */

const JOURNEY_STORAGE_KEY = 'resume-journey';

export function readStoredJourney(): string | undefined {
  try {
    if (typeof localStorage === 'undefined') {
      return undefined;
    }
    return localStorage.getItem(JOURNEY_STORAGE_KEY) || undefined;
  } catch {
    return undefined;
  }
}

export function writeStoredJourney(journey?: string): void {
  try {
    if (typeof localStorage === 'undefined') {
      return;
    }
    if (journey) {
      localStorage.setItem(JOURNEY_STORAGE_KEY, journey);
    } else {
      localStorage.removeItem(JOURNEY_STORAGE_KEY);
    }
  } catch {
    // Storage unavailable (SSR, private mode, blocked) — persistence is best-effort.
  }
}
