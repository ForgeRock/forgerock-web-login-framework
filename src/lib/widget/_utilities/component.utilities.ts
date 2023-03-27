import { derived, writable, type Readable, type Writable } from 'svelte/store';

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
  form: null,
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
