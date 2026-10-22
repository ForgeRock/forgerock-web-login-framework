// Sandboxed preview iframe — no `allow-same-origin`, so author code never shares
// origin/cookies/DOM with the admin shell (the SDKS-5259 opaque-origin decision,
// unchanged by IAM-12011).
//
// IAM-12011 deltas from the SDKS-5324 version:
// 1. The `svelte` runtime and `$login-framework` resolve through an import map
//    to the REAL dev-server modules (/@id/ and /@fs/ URLs) instead of esm.sh
//    and a generated mock data: URL. Real core/ components are compiled by
//    vite-plugin-svelte on demand; no external CDN dependency remains.
//    `$login-framework` maps to src/preview-framework.ts — the curated surface
//    PLUS the widget runtime API (configure/journey/component/user/protect),
//    so authored components import the full public surface (IAM-12011 task 4).
//    `server.cors: true` in vite.config.ts is what lets this opaque-origin
//    iframe fetch them (`Origin: null` + ACAO: *) — a module-supply loosening,
//    not an origin-boundary change. fs.allow scopes supply to core/ +
//    experimental/ + packages/.// 2. A boot script runs the framework's real store initializers so `T` renders
//    real i18n catalog strings and `styleStore` emits real defaults.
import widgetCss from '../../../packages/login-widget/dist/widget.css?raw';
import { brand } from './brand';

export interface SandboxOptions {
  devServerOrigin: string;
  frameworkEntryUrl: string;
}

export function buildSandboxSrcdoc({ devServerOrigin, frameworkEntryUrl }: SandboxOptions): string {
  return `<!doctype html>
<html>
  <head>
    <!--
      Base href points at the dev server so the ABSOLUTE module URLs the Vite
      dev transform emits (/node_modules/.vite/deps/..., /@id/..., /@fs/...)
      resolve against the dev server despite this iframe's opaque origin.
      The origin itself stays null (sandbox without allow-same-origin); only
      URL resolution changes. cors:true in vite.config.ts authorizes the
      resulting cross-origin GETs (Origin: null -> ACAO: *).
    -->
    <base href="${devServerOrigin}/" />
    <script type="importmap">
      {
        "imports": {
          "svelte": "${devServerOrigin}/@id/svelte",
          "svelte/": "${devServerOrigin}/@id/svelte/",
          "$login-framework": "${frameworkEntryUrl}"
        }
      }
    </script>
    <style>html, body { margin: 0; padding: 0; height: 100%; font-family: system-ui, sans-serif; }</style>
    <!--
      Real widget build output (packages/login-widget/dist/widget.css) — the
      tw_* classes authored components use are meaningless without it: no
      Tailwind, so sizes, spacing, and colors all fall back to browser
      defaults instead of the widget's actual look.
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
      .page-shell {
        align-items: center;
        background: #f1f5f9;
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        min-height: 100%;
        padding: 1rem;
      }
      .tw_containing-box {
        background: #fff;
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
      // Boot the real framework stores before the first render: without the
      // locale initializer the T component renders key-derived fallback text
      // (stringsStore starts writable(null)), and without the style/style
      // initializers styleStore stays empty so labels don't float and
      // checks/radios don't animate.
      //
      // The stores are module singletons in this long-lived iframe, so a demo
      // that mutates them (demo-widget-runtime calls configure(), which resets
      // links, style and content) would leak into the next demo. The same boot
      // therefore runs again before every render.
      const bootFramework = async () => {
        const fw = await import('$login-framework');
        fw.initializeLocale?.();
        fw.initializeLinks?.({ termsAndConditions: 'https://example.com/terms' });
        fw.initializeStyles?.();
      };
      (async () => {
        try {
          await bootFramework();
          window.__frameworkReady = true;
          parent.postMessage({ type: 'framework-ready' }, '*');
        } catch (error) {
          parent.postMessage({ type: 'render-error', message: 'Framework boot failed: ' + String(error?.message ?? error) }, '*');
        }
      })();
    </script>
    <script>
      window.addEventListener('message', async (event) => {
        if (event.data?.type !== 'render') return;
        document.getElementById('preview-root').innerHTML = '';
        try {
          await bootFramework();
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
