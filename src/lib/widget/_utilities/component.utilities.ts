
import { writable, type Writable } from 'svelte/store';

import type { SvelteComponent } from 'svelte';

export interface ComponentApi {
  close(args?: { reason: 'auto' | 'external' | 'user' }): void;
  mount(component: SvelteComponent, element: HTMLDialogElement): void;
  open(): void;
}
export interface ComponentStoreValue {
  modal: {
    component: SvelteComponent;
    element: HTMLDialogElement;
  } | null;
  form: {
    element: HTMLFormElement;
  }| null;
  error: { code: string, message: string } | null;
  mounted: boolean;
  open: boolean | null;
  reason: string;
  type: 'inline' | 'modal';
}

const componentStore: Writable<ComponentStoreValue> = writable({
  modal: null,
  form: null,
  error: null,
  mounted: false,
  open: null,
  reason: '',
  type: 'modal',
});
export const componentApi = () => {
  const { update, subscribe } = componentStore;

  return {
    close: (arg?: { reason: 'auto' | 'external' | 'user' }) => {
      update((state) => {
        if (state.type === 'inline') {
          console.warn('Component type of "inline" has no `close` method');
          // There's nothing to do, so just return existing state
          return state;
        }
        return {
          ...state,
          open: false,
          reason: arg?.reason || '',
        }
      });
    },
    mount: (component: SvelteComponent, element: HTMLDialogElement) => {
      update((state) => {
        return {
          ...state,
          component,
          element,
          mounted: true,
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
        return {
          ...state,
          open: true,
        }
      });
    },
    subscribe,
  }
};
