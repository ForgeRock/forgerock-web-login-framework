// Entrypoint wrapper around adapter-node's generated `build/index.js`.
//
// Purpose: rewrite the "Listening on http://0.0.0.0:3000" startup message
// to use `localhost`. The bind address must stay 0.0.0.0 so Docker's
// `-p 3000:3000` port forwarding works, but `0.0.0.0` in the URL bar leads
// developers into a different browser origin than the configured ORIGIN
// env var, which trips SvelteKit's CSRF check on the first POST.
//
// This shim is intentionally minimal — patch the one log line, then hand
// off to the real adapter-node entrypoint.

const originalLog = console.log;
console.log = (...args) => {
  const first = args[0];
  if (typeof first === 'string' && first.startsWith('Listening on http://0.0.0.0:')) {
    originalLog(first.replace('http://0.0.0.0:', 'http://localhost:'), ...args.slice(1));
    return;
  }
  originalLog(...args);
};

await import('./build/index.js');
