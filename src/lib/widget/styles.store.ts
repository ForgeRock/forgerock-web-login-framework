import { readable, type Readable } from "svelte/store";

export let styles: Readable<{ key: string, value: string }>;

// TODO: Implement AJS (JSON Schema) for better usability
export function initStyles(customStyles: { key: string, value: string }) {
  styles = readable(customStyles);
}
