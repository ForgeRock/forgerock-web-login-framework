// Ambient declaration for the `#journey-client-factory` vite alias (resolved
// in vite.config.ts to journey-client's real factory.js, which the package's
// exports map hides from ordinary deep imports). Keeps `npx tsc --noEmit`
// quiet inside editor-poc.
declare module '#journey-client-factory' {
  export function createCallback(callback: unknown): unknown;
}
