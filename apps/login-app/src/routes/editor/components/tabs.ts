/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 * */

import type { ComponentType } from '$lib/server/custom-components/api/api.schemas';

/** The finite set of tab ids — the only valid [tab] route segments. */
export type TabId = 'stage' | 'callback' | 'layout';

/** Tab = UI grouping over Component API types. Layout merges three record kinds. */
export const TABS = [
  { id: 'stage', label: 'Stage Components', types: ['stages'] },
  { id: 'callback', label: 'Callback Components', types: ['callbacks'] },
  { id: 'layout', label: 'Layout', types: ['headers', 'footers', 'containers'] },
] as const satisfies ReadonlyArray<{
  id: TabId;
  label: string;
  types: readonly ComponentType[];
}>;

/** Resolves a [tab] route param, or undefined when the segment is not a tab. */
export const findTab = (tabId: string): (typeof TABS)[number] | undefined =>
  TABS.find((tab) => tab.id === tabId);
