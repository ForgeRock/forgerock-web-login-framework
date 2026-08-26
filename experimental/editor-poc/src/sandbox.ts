// Sandboxed preview iframe — no `allow-same-origin`, so author code never shares
// origin/cookies/DOM with the admin shell. Validates the isolation gap flagged
// against every alternative in Task 2's findings (iframe isolation is owed
// regardless of which compiler produced the code).
//
// NOTE: resolves the bare `svelte` import via esm.sh at the pinned runtime
// version — a real build would self-host the runtime bundle instead of a CDN.
// Flagging this as a gap: an admin-authoring surface should not take an
// external network dependency for its preview sandbox.
import widgetCss from '../../../packages/login-widget/dist/widget.css?raw';
import { brand } from './brand';

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
    <style>html, body { margin: 0; padding: 0; height: 100%; font-family: system-ui, sans-serif; }</style>
    <!--
      Real widget build output (packages/login-widget/dist/widget.css) — the
      tw_* classes authored components use (and $login-framework's mocked
      components reuse) are meaningless without it: no Tailwind, so sizes,
      spacing, and colors all fall back to browser defaults instead of the
      widget's actual look.
    -->
    <style>${widgetCss}</style>
    <style>
      :root {
        --tw-colors-primary-dark-hs: 204, 95%;
        --tw-colors-primary-dark-l: 41%;
        --tw-colors-primary-light-hs: 204, 95%;
        --tw-colors-primary-light-l: 41%;
        --tw-colors-focus-default-hs: 204, 95%;
        --tw-colors-focus-default-l: 41%;
        --fr-button-text-color: #fff;
        --fr-button-border-radius: .25rem;
      }
      .fr_widget-root {
        --fr-font-family: system-ui, sans-serif;
        --fr-body-text-color: ${brand.textPrimary};
      }
    </style>
  </head>
  <body>
    <!--
      Mirrors core/components/primitives/box/centered.svelte — the real
      page-shell + containing-box wrapper every login-app/hosted-pages render
      uses. Without it, preview layout (button height, text sizing, spacing)
      doesn't match production, even once the CSS above is loaded, because
      several of those tw_* rules only take effect inside .tw_containing-box.
    -->
    <div class="page-shell tw_flex tw_justify-center tw_min-h-full">
      <div class="tw_containing-box md:tw_containing-box_medium">
        <div class="fr_widget-root">
          <div id="preview-root"></div>
        </div>
      </div>
    </div>
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
