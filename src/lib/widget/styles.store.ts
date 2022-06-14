import { readable } from "svelte/store";

export let styles;

export function initStyles(customStyles) {
  styles = readable(customStyles);
}
