/**
 *
 * Copyright © 2025 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { derived, type Readable } from 'svelte/store';

import {
  componentStore,
  closeComponent,
  mount,
  type ComponentStoreValue,
} from '$core/component.store';

// Re-export core store items for consumers that import from this module
export { componentStore, closeComponent, mount, type ComponentStoreValue };

/**
 * @function componentApi - this is a widget external API
 * @returns {object} - the public component API
 */
export const componentApi = () => {
  const { update } = componentStore;
  // Create derived store to minimize what's exposed to the dev
  const {
    subscribe,
  }: Readable<Pick<ComponentStoreValue, 'error' | 'lastAction' | 'mounted' | 'open' | 'reason'>> =
    derived([componentStore], ([$componentStore], set) => {
      set({
        error: $componentStore.error,
        lastAction: $componentStore.lastAction,
        mounted: $componentStore.mounted,
        open: $componentStore.open,
        reason: $componentStore.reason,
      });
    });

  return {
    /**
     * Close a modal
     * @param {object} args - object containing  the reason for closing component
     * @returns {void}
     */
    close: (args?: { reason: 'auto' | 'external' | 'user' }) => {
      closeComponent(args, true);
    },
    /**
     * Open a modal
     * @param: void
     * @returns: void
     */
    open: () => {
      update((state) => {
        if (state.type === 'inline') {
          console.warn('Component type of "inline" has no `open` method');
          // There's nothing to do, so just return existing state
          return state;
        }
        if (!state.modal?.component) {
          console.warn('Modal component is not mounted. Please instantiate the Widget before use.');
          // There's nothing to do, so just return existing state
          return state;
        }

        state.modal.element.showModal();

        return {
          ...state,
          lastAction: 'open',
          open: true,
          reason: null,
        };
      });
    },
    /**
     * Subscribe to modal events
     * returns the latest value from the event
     */
    subscribe,
  };
};
