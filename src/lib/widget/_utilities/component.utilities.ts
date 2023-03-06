
import { writable, type Writable } from 'svelte/store';

import type { SvelteComponent } from 'svelte';

export interface ComponentStoreValue {
  error: { code: string, message: string } | null;
  modal: {
    component: SvelteComponent;
    element: HTMLDialogElement;
  } | null;
  mounted: boolean;
  open: boolean | null;
  reason: string;
  type: 'inline' | 'modal' | null;
}

export const componentStore: Writable<ComponentStoreValue> = writable({
  modal: null,
  form: null,
  error: null,
  mounted: false,
  open: null,
  reason: '',
  type: null,
});

export const componentApi = () => {
  const { update, subscribe } = componentStore;

  return {
    close: (args?: { reason: 'auto' | 'external' | 'user' }) => {
      update((state) => {
        if (state.type === 'inline') {
          console.warn('Component type of "inline" has no `close` method');
          // There's nothing to do, so just return existing state
          return state;
        }
        if (!state.modal) {
          console.warn('Modal component is not mounted. Please instantiate the Widget before use.');
          // There's nothing to do, so just return existing state
          return state;
        }

        state.modal?.component.closeDialog();

        return {
          ...state,
          open: false,
          reason: args?.reason || '',
        }
      });
    },
    mount: (component: SvelteComponent, element: HTMLDialogElement) => {
      update((state) => {
        return {
          ...state,
          modal: {
            ...(component && { component, element }),
          },
          mounted: true,
          type: component ? 'modal' : 'inline',
        }
      });
    },
    open: () => {
      update((state) => {
        if (state.type === 'inline') {
          console.warn('Component type of "inline" has no `open` method');
          // There's nothing to do, so just return existing state
          return state;
        }
        if (!state.modal) {
          console.warn('Modal component is not mounted. Please instantiate the Widget before use.');
          // There's nothing to do, so just return existing state
          return state;
        }

        state.modal.element.showModal();

        return {
          ...state,
          open: true,
        }
      });
    },
    subscribe,
  }
};
