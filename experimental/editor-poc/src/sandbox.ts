// Sandboxed preview iframe — no `allow-same-origin`, so author code never shares
// origin/cookies/DOM with the admin shell. Validates the isolation gap flagged
// against every alternative in Task 2's findings (iframe isolation is owed
// regardless of which compiler produced the code).
//
// NOTE: resolves the bare `svelte` import via esm.sh at the pinned runtime
// version — a real build would self-host the runtime bundle instead of a CDN.
// Flagging this as a gap: an admin-authoring surface should not take an
// external network dependency for its preview sandbox.
const SVELTE_VERSION = '5.56.10';

export function buildSandboxSrcdoc(loginFrameworkMockUrl: string): string {
  return `<!doctype html>
<html>
  <head>
    <script type="importmap">
      {
        "imports": {
          "svelte": "https://esm.sh/svelte@${SVELTE_VERSION}",
          "svelte/": "https://esm.sh/svelte@${SVELTE_VERSION}/",
          "$login-framework": "${loginFrameworkMockUrl}"
        }
      }
    </script>
    <style>html, body { margin: 0; padding: 8px; font-family: system-ui, sans-serif; }</style>
  </head>
  <body>
    <div id="preview-root"></div>
    <script>
      window.addEventListener('message', async (event) => {
        if (event.data?.type !== 'render') return;
        document.getElementById('preview-root').innerHTML = '';
        try {
          const blob = new Blob([event.data.code], { type: 'text/javascript' });
          const url = URL.createObjectURL(blob);
          await import(url);
          URL.revokeObjectURL(url);
          parent.postMessage({ type: 'render-ok' }, '*');
        } catch (error) {
          parent.postMessage({ type: 'render-error', message: String(error?.message ?? error) }, '*');
        }
      });
    </script>
  </body>
</html>`;
}
