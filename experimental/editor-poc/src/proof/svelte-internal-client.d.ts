// svelte/internal/client ships without type declarations. The proof page only
// forwards the namespace object to compiled components, so the members are
// intentionally left opaque.
declare module 'svelte/internal/client' {
  export const opaque: never;
}
