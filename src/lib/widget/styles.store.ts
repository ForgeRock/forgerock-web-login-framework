import { readable } from "svelte/store";

export let styles;

// TODO: Implement AJS (JSON Schema) for better usability
export function initStyles(customStyles) {
  styles = readable(customStyles);
}
