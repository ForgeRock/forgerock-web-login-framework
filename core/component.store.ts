/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { writable, type Writable } from 'svelte/store';

import type { SvelteComponent } from 'svelte';

export interface ComponentStoreValue {
  lastAction: 'close' | 'open' | 'mount' | null;
  error: { code: string; message: string } | null;
  modal: {
    component: SvelteComponent;
    element: HTMLDialogElement;
  } | null;
  mounted: boolean;
  open: boolean | null;
  reason: 'auto' | 'external' | 'user' | null;
  type: 'inline' | 'modal' | null;
}

export const componentStore: Writable<ComponentStoreValue> = writable({
  lastAction: null,
  error: null,
  modal: null,
  mounted: false,
  open: null,
  reason: null,
  type: null,
});

/**
 * @function closeComponent - this is a widget internal function not to be exposed to user
 * @param {object} args - object containing  the reason for closing component
 * @param {boolean} shouldCloseDialog - if true, the close command comes from outside of dialog component
 */
export function closeComponent(
  args?: { reason: ComponentStoreValue['reason'] },
  shouldCloseDialog?: boolean,
) {
  componentStore.update((state) => {
    if (state.type === 'inline') {
      console.warn('Component type of "inline" has no `close` method');
      // There's nothing to do, so just return existing state
      return state;
    }
    if (!state.modal?.component) {
      console.warn('Modal component is not mounted. Please instantiate the Widget before use.');
      // There's nothing to do, so just return existing state
      return state;
    }

    shouldCloseDialog && state.modal.component.closeDialog();

    return {
      ...state,
      lastAction: 'close',
      open: false,
      reason: args?.reason || null,
    };
  });
}

/**
 * @function mount - this is a widget internal function not to be exposed to user
 * @param {object} component - actual Svelte component representing the dialog
 * @param {object} element - actual DOM element representing the dialog
 */
export function mount(component: SvelteComponent, element: HTMLDialogElement) {
  componentStore.update((state) => {
    return {
      ...state,
      lastAction: 'mount',
      modal: {
        ...(component && { component, element }),
      },
      mounted: true,
      type: component ? 'modal' : 'inline',
      reason: null,
    };
  });
}
