import { readable, type Readable } from 'svelte/store';

interface Layout {
  labels: 'floating' | 'stacked';
  checkboxAndRadios: 'animated' | 'standard';
}

interface Styles {
  buttons: {
    primary: Record<string, string>[];
    secondary: Record<string, string>[];
    outline: Record<string, string>[];
  };
}

export let styles: Readable<Styles>;

// TODO: Implement Zod for better usability
export function initialize(customStyles: Styles) {
  styles = readable(customStyles);
}
